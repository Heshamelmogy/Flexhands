import { BadgeCheck, Clock, MapPin, Star } from "lucide-react";

type TaskCardProps = {
  task: {
    title: string;
    category: string;
    location: string;
    distance: string;
    price: string;
    status: string;
    urgency: string;
    requester: string;
    rating: string;
  };
  onMakeOffer: () => void;
  onViewProfile?: () => void;
  actionLabel?: string;
  actionDisabled?: boolean;
};

export function TaskCard({ task, onMakeOffer, onViewProfile, actionLabel = "Make offer", actionDisabled = false }: TaskCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-mint px-2 py-1 text-xs font-semibold text-lagoon">{task.category}</span>
            <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
              <Clock size={13} /> {task.urgency}
            </span>
          </div>
          <h3 className="mt-3 text-base font-semibold text-ink">{task.title}</h3>
        </div>
        <p className="shrink-0 text-right text-lg font-bold text-trust">{task.price}</p>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <span className="flex items-center gap-1">
          <MapPin size={15} /> {task.location}, {task.distance}
        </span>
        <button
          type="button"
          onClick={onViewProfile}
          className="focus-ring flex items-center gap-1 rounded-md px-1 py-0.5 text-left hover:bg-slate-100"
        >
          <Star size={15} className="fill-amber text-amber" /> {task.requester} {task.rating}
        </button>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
          <BadgeCheck size={14} /> {task.status}
        </span>
        <button
          onClick={onMakeOffer}
          disabled={actionDisabled}
          className="focus-ring rounded-md bg-trust px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {actionLabel}
        </button>
      </div>
    </article>
  );
}
