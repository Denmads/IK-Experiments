import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RendererService } from './services/renderer-service';
import { vec2 } from 'gl-matrix';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
    protected renderService = inject(RendererService);
    protected canvasElement = viewChild<ElementRef<HTMLCanvasElement>>('canvas');


    private isDragging: boolean = false;

    ngAfterViewInit() {
        this.renderService.setCanvasContext(this.canvasElement()!.nativeElement.getContext('2d')!);
    }

    flipElbow() {
        this.renderService.toggleElbow();
    }

    public onMouseDown(e: MouseEvent) {
        this.isDragging = true;

        let mousePos = vec2.fromValues(
            e.offsetX, e.offsetY
        );

        this.renderService.updateEndEffectorPosition(mousePos);
    }

    public onMouseUp(e: Event) {
        this.isDragging = false;
    }

    public onMouseMove(e: MouseEvent) {
        if (!this.isDragging)
            return;

        let mousePos = vec2.fromValues(
            e.offsetX, e.offsetY
        );

        this.renderService.updateEndEffectorPosition(mousePos);
    }
}
