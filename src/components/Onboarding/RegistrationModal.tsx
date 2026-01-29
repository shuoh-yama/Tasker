"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";
import { useCategories } from "@/hooks/use-categories";

interface RegistrationModalProps {
    isOpen: boolean;
    onRegisterSuccess: () => void;
}

export function RegistrationModal({ isOpen, onRegisterSuccess }: RegistrationModalProps) {
    const { data: session } = useSession();
    const [step, setStep] = useState(1);
    const [name, setName] = useState(session?.user?.name || "");
    const [maxPoints, setMaxPoints] = useState<number>(15);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch categories for display in Step 2
    const { categories, isLoaded: categoriesLoaded } = useCategories();

    // Reset step on close/open
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setName(session?.user?.name || "");
        }
    }, [isOpen, session]);

    const handleNext = () => {
        if (step === 1 && name.trim()) {
            setStep(2);
        }
    };

    const handleRegister = async () => {
        if (!name.trim() || !session?.user?.email) return;

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/members", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: session.user.email,
                    name: name,
                    avatarUrl: session.user.image,
                    maxPoints: maxPoints,
                }),
            });

            if (res.ok) {
                onRegisterSuccess();
            } else {
                alert("登録に失敗しました。もう一度お試しください。");
            }
        } catch (error) {
            console.error("Registration error:", error);
            alert("エラーが発生しました。");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen}>
            <DialogContent className="sm:max-w-md [&>button]:hidden"> {/* Hide default close button logic handled by flow */}
                <DialogHeader>
                    <DialogTitle>
                        {step === 1 ? "ようこそ！" : "目標設定"}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 1
                            ? "チームで使用する表示名を入力してください。"
                            : "週間の最大ポイントポイントを設定しましょう。"}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {step === 1 && (
                        <div className="grid gap-2">
                            <Label htmlFor="name">表示名</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="例: しゅうおう"
                                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                            />
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="text-sm text-muted-foreground space-y-2 bg-muted p-3 rounded-md">
                                <p>このTaskerではタスクにポイントを振って、週間管理します。</p>
                                <p>週あたりのポイント合計値を決めてオーバーしないようにタスク管理しましょう。</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ポイントの目安</Label>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {categoriesLoaded ? categories.map(cat => (
                                        <div key={cat.id} className="flex justify-between border-b pb-1">
                                            <span>{cat.name}</span>
                                            <span className="font-medium">{cat.defaultPoints}pt</span>
                                        </div>
                                    )) : (
                                        <div className="text-muted-foreground col-span-2">読み込み中...</div>
                                    )}
                                </div>
                            </div>

                            <div className="grid gap-2 pt-2">
                                <Label htmlFor="maxPoints">週間最大ポイント</Label>
                                <div className="flex items-center gap-4">
                                    <Input
                                        id="maxPoints"
                                        type="number"
                                        value={maxPoints}
                                        onChange={(e) => setMaxPoints(Number(e.target.value))}
                                        className="w-24 text-right"
                                    />
                                    <span className="text-sm text-muted-foreground">pt / 週</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    ご自身の現在のタスク感から程よい値を設定してください。
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between sm:justify-between">
                    {/* Step 1 Footer */}
                    {step === 1 && (
                        <Button className="w-full" onClick={handleNext} disabled={!name.trim()}>
                            次へ
                        </Button>
                    )}

                    {/* Step 2 Footer */}
                    {step === 2 && (
                        <div className="flex w-full gap-2">
                            <Button variant="outline" onClick={() => setStep(1)} disabled={isSubmitting}>
                                戻る
                            </Button>
                            <Button className="flex-1" onClick={handleRegister} disabled={isSubmitting}>
                                {isSubmitting ? "登録中..." : "登録して開始"}
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
