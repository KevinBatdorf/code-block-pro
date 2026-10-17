export type Pane = { language?: string; code?: string; label?: string };

export type Attributes = {
	version?: number;
	panes?: Pane[];
	legacyContent?: string;
};
