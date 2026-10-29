import './layout.css';

export interface PlannedWorkspaceProps {
	title: string;
	description: string;
	/** When it's planned, e.g. "UI spec Phase 6". */
	when: string;
	onOpenScaleViewer(): void;
}

/** An honest placeholder for a workspace that isn't built yet. */
export function PlannedWorkspace({
	title,
	description,
	when,
	onOpenScaleViewer,
}: PlannedWorkspaceProps) {
	return (
		<div className="planned">
			<h3>{title} isn’t built yet</h3>
			<p>{description}</p>
			<p className="muted">Planned for {when}.</p>
			<button type="button" className="btn" onClick={onOpenScaleViewer}>
				Open Scale Viewer
			</button>
		</div>
	);
}
