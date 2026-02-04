"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMembers } from "@/hooks/use-members";
import { Settings, RefreshCw } from "lucide-react";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { data: session, update: updateSession } = useSession();
    const { members, refreshMembers } = useMembers();

    const [name, setName] = useState("");
    const [maxPoints, setMaxPoints] = useState(15);
    const [avatarUrl, setAvatarUrl] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (session?.user?.email && members.length > 0) {
            const member = members.find(m => m.email === session.user?.email);
            if (member) {
                setName(member.name);
                setMaxPoints(member.maxPoints || 15);
                setAvatarUrl(member.avatarUrl || "");
            } else {
                // Fallback to session data if not found in sheet (rare)
                setName(session.user.name || "");
                setAvatarUrl(session.user.image || "");
            }
        }
    }, [session, members, isOpen]);

    const handleUpdateFromGoogle = async () => {
        if (session?.user?.image) {
            setAvatarUrl(session.user.image);
        }
    };

    const handleSave = async () => {
        if (!session?.user?.email) return;

        setLoading(true);
        try {
            const res = await fetch("/api/members", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: session.user.email,
                    name,
                    maxPoints,
                    avatarUrl
                }),
            });

            if (!res.ok) throw new Error("Failed to update");

            // Refresh local data
            await refreshMembers();

            // Close modal
            onClose();

            // Reload page to reflect changes everywhere thoroughly
            window.location.reload();

        } catch (error) {
            console.error(error);
            alert("更新に失敗しました。");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-foreground">
                        <Settings className="w-5 h-5" /> ユーザー設定
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-foreground">名前</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-background border-input text-foreground"
                        />
                    </div>

                    {/* Max Points */}
                    <div className="space-y-2">
                        <Label htmlFor="maxPoints" className="text-foreground">最大ポイント (キャパシティ)</Label>
                        <Input
                            id="maxPoints"
                            type="number"
                            value={maxPoints}
                            onChange={(e) => setMaxPoints(Number(e.target.value))}
                            className="bg-background border-input text-foreground"
                        />
                        <p className="text-xs text-muted-foreground">
                            週あたりの作業可能ポイント数を設定します。
                        </p>
                    </div>

                    {/* Avatar */}
                    <div className="space-y-2">
                        <Label className="text-foreground">プロフィール画像</Label>
                        <div className="flex items-center gap-4">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt="Avatar Preview"
                                    className="w-16 h-16 rounded-full object-cover border border-border"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                    No Img
                                </div>
                            )}
                            <div className="flex-1 space-y-2">
                                <Input
                                    value={avatarUrl}
                                    onChange={(e) => setAvatarUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="bg-background border-input text-foreground text-xs"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleUpdateFromGoogle}
                                    className="w-full text-xs"
                                >
                                    <RefreshCw className="w-3 h-3 mr-2" />
                                    Googleアカウント画像を取得
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading} className="text-foreground">
                        キャンセル
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-primary text-primary-foreground">
                        {loading ? "保存中..." : "保存する"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
