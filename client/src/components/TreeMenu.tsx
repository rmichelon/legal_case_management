import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TreeMenuItem {
  label: string;
  path?: string;
  icon: React.ReactNode;
  children?: TreeMenuItem[];
  badge?: string | number;
}

interface TreeMenuProps {
  items: TreeMenuItem[];
  onNavigate?: (path: string) => void;
  className?: string;
  defaultExpanded?: string[];
}

export function TreeMenu({
  items,
  onNavigate,
  className,
  defaultExpanded = [],
}: TreeMenuProps) {
  const [location, navigate] = useLocation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(defaultExpanded)
  );

  const isActive = (path?: string) => {
    if (!path) return false;
    return location === path;
  };

  const isGroupActive = (item: TreeMenuItem): boolean => {
    if (item.path && isActive(item.path)) return true;
    if (item.children) {
      return item.children.some((child) => isGroupActive(child));
    }
    return false;
  };

  const toggleExpand = (label: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(label)) {
      newExpanded.delete(label);
    } else {
      newExpanded.add(label);
    }
    setExpandedItems(newExpanded);
  };

  const handleItemClick = (item: TreeMenuItem) => {
    if (item.path) {
      navigate(item.path);
      onNavigate?.(item.path);
    } else if (item.children && item.children.length > 0) {
      toggleExpand(item.label);
    }
  };

  const renderTreeItem = (item: TreeMenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.label);
    const isItemActive = isActive(item.path);
    const isGroupItemActive = isGroupActive(item);

    return (
      <div key={item.label}>
        <button
          onClick={() => handleItemClick(item)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-medium",
            "hover:bg-muted",
            isItemActive
              ? "bg-accent text-accent-foreground"
              : isGroupItemActive && hasChildren
              ? "bg-muted text-foreground"
              : "text-foreground"
          )}
          style={{ paddingLeft: `${12 + level * 16}px` }}
        >
          {hasChildren && (
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </div>
          )}
          {!hasChildren && <div className="w-4 flex-shrink-0" />}

          <div className="flex-shrink-0">{item.icon}</div>

          <span className="flex-1 text-left">{item.label}</span>

          {item.badge && (
            <span className="flex-shrink-0 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-accent text-accent-foreground">
              {item.badge}
            </span>
          )}
        </button>

        {hasChildren && isExpanded && (
          <div className="space-y-0">
            {item.children!.map((child) => renderTreeItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("space-y-1", className)}>
      {items.map((item) => renderTreeItem(item))}
    </div>
  );
}
