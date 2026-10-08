import React from 'react';
import { WorkItemType, Priority } from '../types';
import {
  Bookmark,
  CheckSquare,
  Bug,
  Layers,
  Compass,
  ListTree,
  ShieldAlert,
  ChevronsUp,
  ChevronUp,
  Equal,
  ChevronDown,
  ChevronsDown
} from 'lucide-react';

export const WorkItemIcon: React.FC<{ type: WorkItemType; className?: string }> = ({ type, className = 'w-4 h-4' }) => {
  switch (type) {
    case 'epic':
      return <Layers className={`${className} text-purple-600`} />;
    case 'story':
      return <Bookmark className={`${className} text-emerald-600`} />;
    case 'bug':
      return <Bug className={`${className} text-rose-600`} />;
    case 'spike':
      return <Compass className={`${className} text-amber-600`} />;
    case 'subtask':
      return <ListTree className={`${className} text-indigo-600`} />;
    case 'incident':
      return <ShieldAlert className={`${className} text-red-600`} />;
    case 'task':
    default:
      return <CheckSquare className={`${className} text-blue-600`} />;
  }
};

export const PriorityIcon: React.FC<{ priority: Priority; className?: string }> = ({ priority, className = 'w-4 h-4' }) => {
  switch (priority) {
    case 'blocker':
      return (
        <span title="Blocker (P0)" className="inline-flex">
          <ChevronsUp className={`${className} text-red-600`} />
        </span>
      );
    case 'high':
      return (
        <span title="High (P1)" className="inline-flex">
          <ChevronUp className={`${className} text-orange-600`} />
        </span>
      );
    case 'medium':
      return (
        <span title="Medium (P2)" className="inline-flex">
          <Equal className={`${className} text-amber-600`} />
        </span>
      );
    case 'low':
      return (
        <span title="Low (P3)" className="inline-flex">
          <ChevronDown className={`${className} text-sky-600`} />
        </span>
      );
    case 'lowest':
      return (
        <span title="Lowest (P4)" className="inline-flex">
          <ChevronsDown className={`${className} text-slate-400`} />
        </span>
      );
  }
};
