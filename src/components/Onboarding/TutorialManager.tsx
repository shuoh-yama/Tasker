"use client";

import { useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

interface TutorialManagerProps {
    startTutorial: boolean;
    onComplete: () => void;
}

export function TutorialManager({ startTutorial, onComplete }: TutorialManagerProps) {
    const driverObj = useRef<any>(null);

    useEffect(() => {
        if (!startTutorial) return;

        // Check persistence
        const hasSeen = localStorage.getItem("hasSeenTutorial");
        if (hasSeen === "true") {
            onComplete();
            return;
        }

        driverObj.current = driver({
            showProgress: true,
            allowClose: true,
            animate: true,
            steps: [
                {
                    element: 'header',
                    popover: {
                        title: 'ナビゲーション',
                        description: '週の切り替えやダークモードの設定はここから行えます。',
                        side: "bottom",
                        align: 'start'
                    }
                },
                {
                    element: '#week-summary', // Need to add ID to WeekSummary
                    popover: {
                        title: '週間サマリー',
                        description: 'あなたの今週の獲得ポイントや進捗状況が一目でわかります。',
                        side: "bottom",
                        align: 'start'
                    }
                },
                {
                    element: '#task-input-area', // Need to add ID to input area in MemberDashboard
                    popover: {
                        title: 'タスクの追加',
                        description: 'ここから新しいタスクを追加します。ポイントやカテゴリも設定できます。',
                        side: "bottom",
                        align: 'start'
                    }
                },
                {
                    element: '#tasks-list', // Need to add ID to task list
                    popover: {
                        title: 'タスク一覧',
                        description: '追加したタスクはここに表示されます。完了したらクリックしてチェックを入れましょう。',
                        side: "top",
                        align: 'start'
                    }
                }
            ],
            onDestroyStarted: () => {
                if (!driverObj.current.hasNextStep() || confirm("チュートリアルを終了しますか？")) {
                    driverObj.current.destroy();
                    localStorage.setItem("hasSeenTutorial", "true");
                    onComplete();
                    return true;
                }
                return false;
            },
            onCloseClick: () => {
                driverObj.current.destroy();
                localStorage.setItem("hasSeenTutorial", "true");
                onComplete();
            }
        });

        driverObj.current.drive();

        return () => {
            if (driverObj.current) {
                driverObj.current.destroy();
            }
        }
    }, [startTutorial]);

    return null;
}
