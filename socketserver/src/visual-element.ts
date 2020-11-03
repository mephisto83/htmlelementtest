export interface VisualElement {
    id: string;
    text: string;
    nodeType: string;
    type: "text" | 'image',
    depth: number,
    dimensions: VisualDimension,
    cssProps: { name: string, value: string }[]
}

export interface VisualDimension {
    x: number,
    y: number,
    bottom: number,
    height: number,
    left: number,
    right: number,
    top: number,
    width: number
}

export interface HTMLPaneUpdate {
    id: string;
    elements: HTMLElementUpdate[],
    panelProperties: PaneProperties
}

export interface PaneProperties {
    x_loc: number;
    y_loc: number;
    z_loc: number;

    x_rot: number;
    y_rot: number;
    z_rot: number;

    x_scale: number;
    y_scale: number;
    z_scale: number;
}

export interface HTMLElementUpdate {
    id: string;
    properties: HTMLElementProperties,
    type: string
}

export interface HTMLElementProperties {
    height: number;
    width: number;
    left: number;
    depth: number;
    top: number;
    backgroundColor: Color;
    color: Color;
    src: string;
    areas: VisualElement[]
}

export interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
}