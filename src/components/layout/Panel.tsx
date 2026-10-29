import { useId, useState, type ReactNode } from 'react';
import './layout.css';

export interface PanelProps {
	title: string;
	/** Grid area name, also used as a class: "analysis", "tools", "song"… */
	area: string;
	children: ReactNode;
	/** On narrow screens, the panel can be collapsed to its heading. */
	collapsible?: boolean;
	defaultCollapsed?: boolean;
	/** Extra content on the right of the heading. */
	actions?: ReactNode;
	/** Keep the heading for screen readers but don't show it. */
	hideTitle?: boolean;
}

/**
 * A workspace panel with a heading. Collapsing only applies on tablet and phone
 * widths (the button is hidden on desktop, where every panel is always open).
 */
export function Panel({
	title,
	area,
	children,
	collapsible = false,
	defaultCollapsed = false,
	actions,
	hideTitle = false,
}: PanelProps) {
	const id = useId();
	const [collapsed, setCollapsed] = useState(defaultCollapsed);
	const isCollapsed = collapsible && collapsed;

	return (
		<section
			className={`panel panel--${area}${isCollapsed ? ' is-collapsed' : ''}`}
			aria-labelledby={`${id}-title`}
		>
			<div className={hideTitle ? 'visually-hidden' : 'panel-head'}>
				<h2 id={`${id}-title`} className="panel-title">
					{title}
				</h2>
				{actions}
				{collapsible && (
					<button
						type="button"
						className="btn btn--ghost panel-toggle"
						aria-expanded={!collapsed}
						aria-controls={`${id}-body`}
						onClick={() => setCollapsed((c) => !c)}
					>
						{collapsed ? 'Show' : 'Hide'}
						<span className="visually-hidden"> {title}</span>
					</button>
				)}
			</div>
			<div id={`${id}-body`} className="panel-body">
				{children}
			</div>
		</section>
	);
}
