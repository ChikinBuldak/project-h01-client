import type { Component } from "../../types/ecs";

export interface Material2DProps {
    /** Class name for the HTML element */
    className?: string;
    /** CSS for HTML element */
    styles?: Partial<CSSStyleDeclaration>;
    /** z-index of the element */
    zIndex?: number;
}

export class DomMaterial implements Component {
    public className: string;
    public styles: Partial<CSSStyleDeclaration>;
    public zIndex: number;

    /**
     * Create new DomMaterial2D object
     * @param props Properties of Material2D
     * @param props.className Class name of the HTML. Default name is 'entity'
     * @param props.styles CSS style of the object
     * @param props.zIndex z-index of the HTML element. default to 1
     */
    constructor(props: Material2DProps = {}) {
        this.className = props.className ?? 'entity';
        this.styles = props.styles ?? {};
        this.zIndex = props.zIndex ?? 1;
    }
}