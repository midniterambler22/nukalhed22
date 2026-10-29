import type { KeyboardEvent } from 'react';
import './layout.css';

export interface WorkspaceTab<Id extends string> {
	id: Id;
	label: string;
	/** Shown in the tab for areas that aren't built yet. */
	planned?: boolean;
}

export interface WorkspaceTabsProps<Id extends string> {
	tabs: readonly WorkspaceTab<Id>[];
	active: Id;
	onChange(id: Id): void;
	/** Id of the tab panel the tabs control. */
	panelId: string;
	idPrefix: string;
}

/** Workspace tabs (ARIA tabs pattern): arrow keys, Home and End move between them. */
export function WorkspaceTabs<Id extends string>({
	tabs,
	active,
	onChange,
	panelId,
	idPrefix,
}: WorkspaceTabsProps<Id>) {
	function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
		const last = tabs.length - 1;
		const target =
			event.key === 'ArrowRight'
				? index === last
					? 0
					: index + 1
				: event.key === 'ArrowLeft'
					? index === 0
						? last
						: index - 1
					: event.key === 'Home'
						? 0
						: event.key === 'End'
							? last
							: -1;
		const tab = tabs[target];
		if (!tab) return;
		event.preventDefault();
		onChange(tab.id);
		document.getElementById(`${idPrefix}-${tab.id}`)?.focus();
	}

	return (
		<div className="workspace-tabs" role="tablist" aria-label="Workspace">
			{tabs.map((tab, index) => {
				const selected = tab.id === active;
				return (
					<button
						key={tab.id}
						id={`${idPrefix}-${tab.id}`}
						type="button"
						role="tab"
						className="workspace-tab"
						aria-selected={selected}
						aria-controls={panelId}
						tabIndex={selected ? 0 : -1}
						onClick={() => onChange(tab.id)}
						onKeyDown={(event) => onKeyDown(event, index)}
					>
						{tab.label}
						{tab.planned && <span className="workspace-tab-badge">Planned</span>}
					</button>
				);
			})}
		</div>
	);
}
