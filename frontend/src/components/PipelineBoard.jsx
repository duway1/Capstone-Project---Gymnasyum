import {
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageCircle,
  Eye,
  RotateCcw,
  Sparkles,
  Check
} from 'lucide-react';

export default function PipelineBoard({
  reminders = [],
  onOpenMessageDrafter,
  onOpenTimeline,
  onQuickUpdateStatus
}) {
  const scheduledList = reminders.filter((r) => r.status === 'scheduled');
  const sentList = reminders.filter((r) => r.status === 'sent');
  const resolvedList = reminders.filter(
    (r) => r.status === 'responded' || r.status === 'no_response'
  );

  const columns = [
    {
      id: 'scheduled',
      title: '1. Terjadwal (Scheduled)',
      sub: 'Siap dikirimi pesan pengingat WhatsApp',
      count: scheduledList.length,
      items: scheduledList,
      icon: Clock,
      colorCls: 'col-scheduled'
    },
    {
      id: 'sent',
      title: '2. Pesan Terkirim (Sent)',
      sub: 'Terkirim via WhatsApp, menunggu konfirmasi',
      count: sentList.length,
      items: sentList,
      icon: Send,
      colorCls: 'col-sent'
    },
    {
      id: 'resolved',
      title: '3. Hasil Respon (Outcome)',
      sub: 'Merespons hadir atau tanpa balasan',
      count: resolvedList.length,
      items: resolvedList,
      icon: CheckCircle2,
      colorCls: 'col-resolved'
    }
  ];

  const formatTime = (iso) => {
    if (!iso) return '-';
    try {
      return (
        new Intl.DateTimeFormat('id-ID', {
          hour: '2-digit',
          minute: '2-digit'
        }).format(new Date(iso)) + ' WIB'
      );
    } catch {
      return '-';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high':
        return { text: 'Tinggi', cls: 'priority-high' };
      case 'medium':
        return { text: 'Sedang', cls: 'priority-medium' };
      default:
        return { text: 'Normal', cls: 'priority-low' };
    }
  };

  return (
    <div className="pipeline-board-container">
      <div className="pipeline-columns-grid pipeline-columns-3">
        {columns.map((col) => {
          const ColIcon = col.icon;
          return (
            <div key={col.id} className={`pipeline-column ${col.colorCls}`}>
              <div className="column-header-bar">
                <div className="column-title-box">
                  <ColIcon size={16} />
                  <strong>{col.title}</strong>
                </div>
                <span className="column-badge-counter">{col.count}</span>
              </div>
              <p className="column-subtext">{col.sub}</p>

              <div className="pipeline-cards-scroll">
                {col.items.length > 0 ? (
                  col.items.map((r) => {
                    const prio = getPriorityLabel(r.priority);
                    const isResponded = r.status === 'responded';
                    const isNoResponse = r.status === 'no_response';

                    return (
                      <div key={r.id} className="pipeline-card">
                        <div className="card-top-row">
                          <span className={`badge-pill ${prio.cls}`}>
                            {prio.text}
                          </span>
                          {r.session_type && (
                            <span className="badge-pill badge-session-type">
                              {r.session_type}
                            </span>
                          )}
                          <span className="card-time-pill">
                            <Clock size={11} /> {formatTime(r.starts_at)}
                          </span>
                        </div>

                        <strong className="card-member-name">{r.name}</strong>
                        <div className="card-class-tag">{r.class_name}</div>
                        <div className="card-phone-row">
                          <Phone size={12} /> {r.phone}
                        </div>

                        {/* Status tag in column 3 */}
                        {col.id === 'resolved' && (
                          <div className="card-resolved-status-row">
                            {isResponded ? (
                              <span className="badge-pill status-responded">
                                <Check size={12} /> Merespons Hadir
                              </span>
                            ) : (
                              <span className="badge-pill status-no-response">
                                <AlertCircle size={12} /> Tanpa Balasan
                              </span>
                            )}
                          </div>
                        )}

                        {r.note && (
                          <p className="card-note-snippet">&ldquo;{r.note}&rdquo;</p>
                        )}

                        {/* Card Actions according to the stage */}
                        <div className="card-actions-footer">
                          {col.id === 'scheduled' && (
                            <button
                              type="button"
                              className="btn-card-action btn-card-wa"
                              onClick={() => onOpenMessageDrafter(r.id)}
                              title="Kirim pesan WhatsApp terformat (wa.me)"
                            >
                              <MessageCircle size={13} />
                              <span>Kirim WA</span>
                            </button>
                          )}

                          {col.id === 'sent' && (
                            <div className="card-action-buttons-group">
                              <button
                                type="button"
                                className="btn-card-action btn-card-confirm"
                                onClick={() =>
                                  onQuickUpdateStatus &&
                                  onQuickUpdateStatus(r.id, 'responded', 'Member konfirmasi hadir')
                                }
                                title="Tandai member merespons hadir"
                              >
                                <Check size={12} />
                                <span>Hadir</span>
                              </button>
                              <button
                                type="button"
                                className="btn-card-action btn-card-no-res"
                                onClick={() =>
                                  onQuickUpdateStatus &&
                                  onQuickUpdateStatus(r.id, 'no_response', 'Belum ada balasan dari member')
                                }
                                title="Tandai tanpa balasan"
                              >
                                <AlertCircle size={12} />
                                <span>No Respon</span>
                              </button>
                            </div>
                          )}

                          {col.id === 'resolved' && isNoResponse && (
                            <button
                              type="button"
                              className="btn-card-action btn-card-followup"
                              onClick={() => onOpenMessageDrafter(r.id)}
                              title="Kirim pesan follow up ke-2 atau penawaran reschedule"
                            >
                              <RotateCcw size={12} />
                              <span>Follow-Up 2</span>
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn-card-action btn-card-track"
                            onClick={() => onOpenTimeline(r.id)}
                            title="Lacak jejak alur status end-to-end"
                          >
                            <Eye size={13} />
                            <span>Lacak</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-column-box">
                    <p>Tidak ada kartu di tahap ini.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
