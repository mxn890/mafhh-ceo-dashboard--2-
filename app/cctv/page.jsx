'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Navigation from '../components/common/Navigation';
import { dashboardLoginPath } from '../lib/auth/return-path';
import SeatVideo from './SeatVideo';
import styles from './review.module.css';

const REVIEW_ID = /^[a-f0-9]{64}$/;
const CAMERAS = { operations_1: 'Operations 1', operations_2: 'Operations 2' };
const STATE = {
  'waiting-validation': 'Awaiting chair calibration',
  queued: 'Queued',
  exporting: 'Preparing footage',
  'waiting-footage': 'Waiting for recording',
  budget: 'Waiting for AI budget',
  'ai-requesting': 'Reviewing seat images',
  complete: 'Ready for review',
  'needs-review': 'Needs attention',
  expired: 'Evidence expired',
};
const OBS = { person_visible: 'Person visible', no_person_visible: 'No person visible', unclear: 'Unclear view' };
const timeFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Karachi', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
});

function pkt(value) {
  if (!value) return '—';
  const date = new Date(typeof value === 'number' ? value * 1000 : value);
  return Number.isNaN(date.getTime()) ? '—' : timeFormat.format(date);
}

function reviewWindow(end) {
  return end ? [pkt(end - 1800), pkt(end)].join(' – ') : '—';
}

function monitorLabel(status) {
  if (!status) return ['Status unavailable', 'neutral'];
  if (!status.enabled) return ['Monitoring disabled', 'neutral'];
  if (status.recorder && !status.recorder.healthy) return ['Recorder offline', 'warning'];
  if (status.refinementMode && status.refinementMode !== 'active') return ['Chair calibration pending', 'warning'];
  if (status.reviewActive === false) return ['Reviews paused', 'warning'];
  return status.refinementMode === 'active' ? ['Automatic review on', 'good'] : ['Activation pending', 'warning'];
}

function Status({ children, tone = 'neutral' }) {
  return <span className="cctv-status" data-tone={tone}>{children}</span>;
}

function Badge({ state }) {
  const tone = state === 'complete' ? 'good' : ['needs-review', 'waiting-validation'].includes(state) ? 'warning' : 'neutral';
  return <Status tone={tone}>{STATE[state] || state || 'Unknown'}</Status>;
}

function Icon({ name }) {
  const paths = {
    camera: 'M3 7h13v10H3z M16 10l5-3v10l-5-3',
    refresh: 'M20 7v5h-5 M4 17v-5h5 M20 12a8 8 0 0 0-13-6 M4 12a8 8 0 0 0 13 6',
    arrow: 'M5 12h14 M13 6l6 6-6 6',
  };
  return <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>;
}

export default function CCTVPage() {
  const [status, setStatus] = useState(null);
  const [reviews, setReviews] = useState(null);
  const [selected, setSelected] = useState('');
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [busy, setBusy] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const sequence = useRef(0);
  const detailSequence = useRef(0);
  const redirecting = useRef(false);
  const evidence = useRef(null);

  const json = useCallback(async (path) => {
    const response = await fetch('/api/cctv/' + path, { cache: 'no-store' });
    if (response.status === 401) {
      if (!redirecting.current) {
        redirecting.current = true;
        const { pathname, search, hash } = window.location;
        window.location.replace(dashboardLoginPath(pathname + search + hash));
      }
      throw new Error('Sign in to view CCTV.');
    }
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'CCTV is temporarily unavailable.');
    return body;
  }, []);

  const load = useCallback(async () => {
    const request = ++sequence.current;
    setRefreshing(true);
    const [current, queue] = await Promise.allSettled([json('status'), json('reviews')]);
    if (request !== sequence.current) return;

    if (current.status === 'fulfilled') setStatus(current.value);
    if (queue.status === 'fulfilled') setReviews(queue.value.reviews || []);
    const messages = [current, queue]
      .filter(result => result.status === 'rejected')
      .map(result => result.reason?.message || 'CCTV connection unavailable.');
    setError([...new Set(messages)].join(' '));
    setBusy(false);
    setRefreshing(false);
  }, [json]);

  useEffect(() => {
    function readSelection() {
      const id = new URLSearchParams(window.location.search).get('review');
      setSelected(REVIEW_ID.test(id || '') ? id : '');
    }
    readSelection();
    window.addEventListener('popstate', readSelection);
    load();
    const timer = setInterval(load, 30000);
    return () => {
      window.removeEventListener('popstate', readSelection);
      clearInterval(timer);
      sequence.current++;
    };
  }, [load]);

  useEffect(() => {
    setDetail(null);
    setDetailError('');
    if (!selected) return;

    async function refresh() {
      const request = ++detailSequence.current;
      try {
        const result = await json('reviews/' + selected);
        if (request === detailSequence.current) {
          setDetail(result);
          setDetailError('');
        }
      } catch (error) {
        if (request === detailSequence.current) setDetailError(error.message);
      }
    }

    refresh();
    const timer = setInterval(refresh, 30000);
    return () => {
      detailSequence.current++;
      clearInterval(timer);
    };
  }, [json, selected]);

  function choose(id) {
    const url = new URL(window.location.href);
    url.searchParams.set('review', id);
    window.history.replaceState(null, '', url);
    if (id !== selected) {
      setDetail(null);
      setDetailError('');
      setSelected(id);
    }
    evidence.current?.focus({ preventScroll: true });
    evidence.current?.scrollIntoView({ block: 'start' });
  }

  const [monitor, monitorTone] = monitorLabel(status);
  const mappings = status?.mappings || [];
  const bindingIssues = Object.keys(status?.bindingIssues || {});
  const ready = reviews?.filter(review => review.state === 'complete').length;
  const calibrationPending = status?.refinementMode && status.refinementMode !== 'active';
  const recorderOffline = status?.recorder && !status.recorder.healthy;

  return (
    <div className={styles.workspace}>
      <Navigation />
      <main className="cctv-main">
        <header className="cctv-hero">
          <div>
            <span className="cctv-context"><Icon name="camera" /> Operations monitoring</span>
            <h1>CCTV Review</h1>
            <p>Review workstation and room footage from the Operations cameras.</p>
          </div>
          <div className="cctv-actions">
            <Status tone={monitorTone}>{monitor}</Status>
            <button className="cctv-refresh" type="button" onClick={load} disabled={refreshing}>
              <Icon name="refresh" /> {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </header>

        <dl className="cctv-metrics">
          <div><dt>Recorder</dt><dd>{status?.recorder ? (recorderOffline ? 'Offline' : 'Online') : '—'}</dd></div>
          <div><dt>Mapped workstations</dt><dd>{status ? mappings.length : '—'}</dd></div>
          <div><dt>Ready in queue</dt><dd>{ready ?? '—'}</dd></div>
          <div><dt>Last signal check · PKT</dt><dd>{pkt(status?.lastPollAt)}</dd></div>
        </dl>

        {error && <p role="alert" className="cctv-message" data-tone="warning">{error}</p>}
        {recorderOffline && <p role="alert" className="cctv-message" data-tone="warning">New reviews are waiting for complete recordings.</p>}
        {calibrationPending && <p role="status" className="cctv-message">Automatic review notices are paused pending target-chair calibration.</p>}

        <div className="cctv-evidence-anchor" tabIndex={-1} ref={evidence}>
          {detailError && <p role="alert" className="cctv-message" data-tone="warning">{detailError}</p>}
          {selected && !detail && !detailError && <p className="cctv-message" role="status">Loading selected review…</p>}
          {detail && <ReviewEvidence detail={detail} />}
        </div>

        <div className="cctv-columns">
          <section className="cctv-panel cctv-queue">
            <header className="cctv-panel-heading"><h2>Camera reviews</h2><span>Pakistan time</span></header>
            {busy ? <p role="status" className="cctv-empty">Loading reviews…</p> : reviews?.length ? (
              <ul className="cctv-review-list">
                {reviews.map(review => (
                  <li key={review.id}>
                    <button type="button" className="cctv-review-row" aria-pressed={selected === review.id} onClick={() => choose(review.id)}>
                      <span className="cctv-review-person"><strong>{review.pcId}</strong><small>{review.employee || 'Unassigned'}</small></span>
                      <span className="cctv-window">{reviewWindow(review.end)}</span>
                      <Badge state={review.state} />
                      <Icon name="arrow" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : <div className="cctv-empty"><Icon name="camera" /><strong>{reviews === null ? 'Review list unavailable' : 'No camera reviews yet'}</strong><p>{reviews === null ? 'Use Refresh to try again.' : 'New reviews appear here when a mapped workstation reports an eligible idle episode.'}</p></div>}
          </section>

          <aside className="cctv-panel cctv-workstations">
            <header className="cctv-panel-heading"><h2>Workstation views</h2></header>
            {mappings.length ? <ul>
              {mappings.map(mapping => (
                <li key={mapping.pcId}><strong>{mapping.pcId} <small>· Seat {mapping.physicalSeat}</small></strong><span>{CAMERAS[mapping.camera] || mapping.camera}</span></li>
              ))}
            </ul> : <p className="cctv-empty">{busy ? 'Loading mappings…' : 'No workstation views available.'}</p>}
            {bindingIssues.length > 0 && <p role="alert" className="cctv-message" data-tone="warning">Reviews held for {bindingIssues.join(', ')}. Check their seat bindings.</p>}
            {status?.sourceError && <p role="alert" className="cctv-message" data-tone="warning">{status.sourceError}</p>}
            {Number.isFinite(status?.aiCallsToday) && Number.isFinite(status?.dailyCctvLimit) && <p className="cctv-budget">CCTV AI usage today <strong>{status.aiCallsToday} / {status.dailyCctvLimit}</strong></p>}
          </aside>
        </div>

        <details className="cctv-guide">
          <summary>How to interpret CCTV evidence</summary>
          <p>A fresh on-duty PC signal with at least 30 minutes without input starts one review per idle episode. Six masked seat images are sampled five minutes apart. No PC input can occur during paperwork, calls or other desk work. Samples alone cannot establish continuous absence, continuous presence, sleeping or an exact departure time. Displayed times follow the server recording timeline while camera clocks are being calibrated.</p>
        </details>
      </main>
    </div>
  );
}

const ROOM_EVENTS = [
  { key: 'crowd', title: 'Gathering review', note: 'Gathering area approval required.' },
  { key: 'posture', title: 'Head-down posture review', note: 'Possible ordinary activity. Samples cannot establish sleeping.' },
  { key: 'absence', title: 'Sampled seat absence review', note: 'PC idle signal and no seated person visible in the samples. Continuous absence is unconfirmed.' },
];

const REVIEW_ISSUES = {
  'recorder-unavailable': 'Waiting for the recorder to recover.',
  'v37-validation-pending': 'Target-chair mapping validation is pending.',
  'pre-refinement-signal-not-replayed': 'This signal predates activation.',
  'v37-recording-not-ready': 'Waiting for complete recording coverage.',
  'v37-evidence-preparation-failed': 'Target-seat evidence preparation needs attention.',
  'v37-provider-outcome-unknown': 'The AI outcome is unknown. Automatic retry is disabled.',
  'v37-invalid-evidence': 'Target-chair evidence needs manual validation.',
  'ai-budget': 'The CCTV daily AI allowance is used.',
  'shared-ai-budget': 'Waiting for the shared Module4 AI budget.',
  'recording-incomplete': 'Some required footage is missing.',
  'recording-not-ready': 'Waiting for recording segments to finish.',
  'ai-provider-error': 'AI provider did not return a usable result.',
  'ai-outcome-unknown': 'The AI request outcome is unknown. Automatic retry is disabled.',
  'ai-evidence-invalid': 'AI evidence needs manual review.',
  'evidence-export-failed': 'Video preparation needs attention.',
  'storage-limit': 'Evidence storage limit reached.',
  'employee-binding-changed': 'Employee assignment changed. Check the seat mapping.',
  'employee-binding-missing': 'Employee attribution is missing.',
  'seat-binding-incomplete': 'Seat binding is incomplete.',
  'evidence-retention': 'Private evidence reached its retention limit.',
  'review-too-old': 'This review exceeded its processing window.',
};

function ReviewEvidence({ detail }) {
  const room = detail.reviewKind === 'room';
  const view = room ? (CAMERAS[detail.camera] || detail.camera) : 'Physical seat ' + detail.physicalSeat;

  return (
    <section className="cctv-panel cctv-evidence">
      <header className="cctv-panel-heading">
        <div>
          <h2>{detail.pcId || 'Room review'}{detail.employee && ' · ' + detail.employee}</h2>
          <p className="text-sm text-slate mt-1">{view} · {reviewWindow(detail.end)} PKT</p>
        </div>
        <Badge state={detail.state} />
      </header>

      {detail.manualValidation ? (
        <p role="status" className="cctv-message">
          {room ? 'Manual room review. Gathering and head-down observations require human review.' : 'Validation preview of the video and AI pipeline.'} WhatsApp notices are disabled for validation.
        </p>
      ) : (
        <p className="text-sm text-slate mt-4">
          {Number.isFinite(detail.idleSeconds) && <>PC no-input time at trigger was {Math.floor(detail.idleSeconds / 60)} minutes. </>}
          Employee labels come from PC assignments.
        </p>
      )}

      {detail.roomEvents && (
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          {ROOM_EVENTS.map(({ key, title, note }) => {
            const events = detail.roomEvents[key] || [];
            return (
              <section className="border border-line rounded-lg p-4" key={key}>
                <h3>{title}</h3>
                {!events.length && <p className="text-sm text-slate mt-2">No qualifying candidate in these samples.</p>}
                {events.map((event, index) => (
                  <div className="text-sm mt-3" key={index}>
                    <strong>{event.pcId || 'Room observation'}</strong>
                    <p>{event.samples} samples · {pkt(event.first)} – {pkt(event.last)} PKT</p>
                    <p className="text-slate">{note}</p>
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      )}

      {detail.summary && <p className="cctv-message">{detail.summary}</p>}
      {detail.issue && <p className="text-sm text-slate mt-3">{REVIEW_ISSUES[detail.issue] || 'This review needs attention.'}</p>}
      {detail.mediaReady && (
        <>
          <SeatVideo review={detail} />
          <div className="cctv-samples">
            {(detail.samples || []).map(sample => {
              const observation = detail.observations?.find(row => row.index === sample.index);
              const label = room && observation
                ? observation.visiblePeopleMinimum + ' clearly evidenced people (minimum)'
                : OBS[observation?.state] || 'AI review pending';
              return (
                <figure className="border border-line rounded-lg overflow-hidden" key={sample.index}>
                  <a href={sample.imageUrl} target="_blank" rel="noreferrer">
                    <img loading="lazy" src={sample.imageUrl} alt={view + ', sample ' + sample.index} className="cctv-sample-image" />
                  </a>
                  <figcaption className="p-3">
                    <strong className="text-sm">Sample {sample.index} · {pkt(sample.serverRequestedAt)} PKT</strong>
                    <p className="text-sm text-slate mt-1">{label}</p>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </>
      )}
      {detail.notified && <p className="text-xs text-slate mt-4">WhatsApp notice queued. Delivery is unconfirmed.</p>}
    </section>
  );
}
