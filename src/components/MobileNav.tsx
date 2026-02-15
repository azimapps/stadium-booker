import { useLocation, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Home, Calendar, PlaySquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

const MobileNav = () => {
    const { t } = useLanguage();
    const location = useLocation();

    if (location.pathname === "/auth") {
        return null;
    }

    const items = [
        {
            name: t("nav.home"),
            path: "/",
            icon: Home,
        },
        {
            name: t("nav.orders"),
            path: "/bookings", // Placeholder path
            icon: Calendar,
        },
        {
            name: t("nav.media"),
            path: "/tournaments", // Using tournaments page for Media section
            icon: PlaySquare,
        },
        {
            name: t("nav.profile"),
            path: "/profile",
            icon: User,
        },
    ];

    return (
        <div className="fixed bottom-6 left-4 right-4 z-50 lg:hidden">
            <div className="flex items-center justify-around bg-background/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-2 h-[4.5rem]">
                {items.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full rounded-xl transition-all duration-300 gap-1",
                                isActive
                                    ? "bg-primary/20 text-primary shadow-[0_0_20px_rgba(34,197,94,0.3)]" // Assuming primary is green-ish
                                    : "text-muted-foreground hover:bg-white/5 active:scale-95"
                            )}
                        >
                            <item.icon
                                className={cn("h-5 w-5 transition-transform duration-300", isActive ? "scale-110" : "")}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            <span className={cn("text-[10px] font-medium transition-colors", isActive ? "text-primary font-bold" : "")}>
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default MobileNav;
