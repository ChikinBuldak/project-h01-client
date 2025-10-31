import type { Component } from "../../types/ecs";

export interface Material2DProps {
    className?: string;
    styles?: Partial<CSSStyleDeclaration>;
    zIndex?: number;
}

export class DomMaterial2D implements Component {
    public className: string;
    public styles: Partial<CSSStyleDeclaration>;
    public zIndex: number;

    constructor(props: Material2DProps = {}) {
        this.className = props.className ?? 'entity';
        this.styles = props.styles ?? {};
        this.zIndex = props.zIndex ?? 1;
    }
}