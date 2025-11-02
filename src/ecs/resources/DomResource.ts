import type { Resource } from "@/types";

export class DomResource implements Resource {
    /** Elemen utama <div id="world-container"> */
    public container: HTMLElement | null = null;
    
    /** Elemen <div id="world"> yang digerakkan oleh kamera */
    public worldElement: HTMLElement | null = null;

    /**
     * Pemetaan semua entitas yang di-render ke elemen DOM mereka.
     * DomRenderSystem akan mengelola map ini.
     */
    public elements = new Map<number, HTMLDivElement>();
}