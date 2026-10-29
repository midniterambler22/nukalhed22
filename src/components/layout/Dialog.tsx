import { useEffect, useId, useRef, type ReactNode } from 'react';
import './layout.css';

export interface DialogProps {
	title: string;
	open: boolean;
	onClose(): void;
	children: ReactNode;
}

/** A modal dialog on the native <dialog> element: Escape and the Close button close it. */
export function Dialog({ title, open, onClose, children }: DialogProps) {
	const ref = useRef<HTMLDialogElement>(null);
	const id = useId();

	useEffect(() => {
		const dialog = ref.current;
		if (!dialog) return;
		if (open && !dialog.open) {
			// jsdom has no showModal; fall back to a non-modal open there.
			if (typeof dialog.showModal === 'function') dialog.showModal();
			else dialog.setAttribute('open', '');
		} else if (!open && dialog.open) {
			if (typeof dialog.close === 'function') dialog.close();
			else dialog.removeAttribute('open');
		}
	}, [open]);

	return (
		<dialog
			ref={ref}
			className="dialog"
			aria-labelledby={`${id}-title`}
			onClose={onClose}
			onCancel={(event) => {
				event.preventDefault();
				onClose();
			}}
		>
			<div className="dialog-head">
				<h2 id={`${id}-title`}>{title}</h2>
				<button type="button" className="btn btn--ghost" onClick={onClose}>
					Close
				</button>
			</div>
			<div className="dialog-body">{open && children}</div>
		</dialog>
	);
}
