"use client";

import { t } from "@/lib/i18n";
import { useZaitunStore } from "@/store/zaitun";
import { motion } from "framer-motion";
import { Plus, Clock, Loader2, Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";
import { LifeEventFormDialog, type LifeEventData } from "./LifeEventFormDialog";

type LifeEvent = {
  id: string;
  personId: string;
  year: string;
  title: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type PersonTimelineProps = {
  personId: string;
  treeId: string;
  canEdit?: boolean;
};

export function PersonTimeline({ personId, treeId, canEdit = true }: PersonTimelineProps) {
  const { locale } = useZaitunStore();
  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<LifeEventData | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/persons/events?personId=${personId}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [personId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleAdd = () => {
    setEditingEvent(null);
    setFormOpen(true);
  };

  const handleEdit = (event: LifeEvent) => {
    setEditingEvent({
      id: event.id,
      year: event.year,
      title: event.title,
      description: event.description || "",
      sortOrder: event.sortOrder,
    });
    setFormOpen(true);
  };

  const handleDelete = async (event: LifeEvent) => {
    if (!confirm(t(locale, "timeline.deleteConfirm"))) return;
    try {
      const res = await fetch(`/api/persons/events?id=${event.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setEvents((prev) => prev.filter((e) => e.id !== event.id));
        toast.success(t(locale, "common.delete"));
      }
    } catch {
      // ignore
    }
  };

  const handleSave = (data: LifeEventData) => {
    if (data.id) {
      // Update
      setEvents((prev) =>
        prev.map((e) =>
          e.id === data.id
            ? {
                ...e,
                year: data.year,
                title: data.title,
                description: data.description || null,
                sortOrder: data.sortOrder ?? e.sortOrder,
              }
            : e
        )
      );
    } else {
      // Add
      setEvents((prev) => [
        ...prev,
        {
          id: data.id || "",
          personId,
          year: data.year,
          title: data.title,
          description: data.description || null,
          sortOrder: data.sortOrder ?? prev.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-emerald-300" />
          </div>
          <p className="text-emerald-700/60">{t(locale, "timeline.noEvents")}</p>
          {canEdit && (
            <Button
              onClick={handleAdd}
              className="mt-4 bg-emerald-700 hover:bg-emerald-800 text-white gap-2"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              {t(locale, "timeline.addEvent")}
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="relative pl-8">
          {/* Vertical line */}
          <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-emerald-300" />

          <div className="space-y-6">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
                className="relative group"
              >
                {/* Node circle */}
                <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-emerald-600 border-2 border-white shadow-sm flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>

                {/* Content */}
                <div className="ml-2 bg-white rounded-xl border border-emerald-100 p-4 hover:border-emerald-200 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-emerald-700 text-white text-xs font-bold">
                          {event.year}
                        </span>
                      </div>
                      <h4 className="font-semibold text-emerald-950 text-sm">
                        {event.title}
                      </h4>
                      {event.description && (
                        <p className="text-sm text-emerald-700/60 mt-1 leading-relaxed">
                          {event.description}
                        </p>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleEdit(event)}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(event)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Add button at bottom */}
          {canEdit && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: events.length * 0.06 + 0.1 }}
              className="relative mt-6"
            >
              <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-emerald-300 border-2 border-white shadow-sm flex items-center justify-center">
                <Plus className="w-3 h-3 text-white" />
              </div>
              <div className="ml-2">
                <Button
                  variant="outline"
                  onClick={handleAdd}
                  className="border-dashed border-emerald-300 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400 gap-2 text-sm"
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                  {t(locale, "timeline.addEvent")}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      <LifeEventFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        event={editingEvent}
        personId={personId}
        treeId={treeId}
        onSave={handleSave}
      />
    </div>
  );
}