
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
    const { theme, toggleTheme } = useTheme();

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "w-9 h-9 rounded-full transition-all duration-300",
                        "hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20",
                        className
                    )}
                    onClick={toggleTheme}
                >
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Chuyển đổi giao diện</span>
                </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
                <p>{theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}</p>
            </TooltipContent>
        </Tooltip>
    );
}
