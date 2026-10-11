import React from "react";
import { 
  Users, 
  UserCheck, 
  Quote, 
  Heart, 
  Repeat2, 
  Bookmark, 
  UserPlus 
} from "lucide-react";

export interface DailyMetricData {
  registeredUsers: number;
  activeUsers: number;
  quotesCreated: number;
  likesCreated: number;
  repostsCreated: number;
  bookmarksCreated: number;
  followsCreated: number;
}

export interface MetricsCardsProps {
  metric?: DailyMetricData;
  data?: DailyMetricData;
}

export function MetricsCards({ metric, data }: MetricsCardsProps) {
  const currentMetric = metric || data || {
    registeredUsers: 0,
    activeUsers: 0,
    quotesCreated: 0,
    likesCreated: 0,
    repostsCreated: 0,
    bookmarksCreated: 0,
    followsCreated: 0,
  };

  const cards = [
    {
      label: "Registered Users",
      value: currentMetric.registeredUsers.toLocaleString(),
      icon: Users,
      description: "Total registered accounts",
    },
    {
      label: "Active Users (24h)",
      value: currentMetric.activeUsers.toLocaleString(),
      icon: UserCheck,
      description: "Daily active users",
    },
    {
      label: "Quotes Created",
      value: currentMetric.quotesCreated.toLocaleString(),
      icon: Quote,
      description: "Total published quotes",
    },
    {
      label: "Likes Given",
      value: currentMetric.likesCreated.toLocaleString(),
      icon: Heart,
      description: "Total likes engagement",
    },
    {
      label: "Reposts",
      value: currentMetric.repostsCreated.toLocaleString(),
      icon: Repeat2,
      description: "Content distribution",
    },
    {
      label: "Bookmarks Saved",
      value: currentMetric.bookmarksCreated.toLocaleString(),
      icon: Bookmark,
      description: "Private quote bookmarks",
    },
    {
      label: "Follow Relationships",
      value: currentMetric.followsCreated.toLocaleString(),
      icon: UserPlus,
      description: "Social graph connections",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="p-5 rounded-xl border border-border bg-card text-card-foreground shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {card.label}
              </span>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight">
              {card.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
