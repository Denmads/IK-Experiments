import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NumberInput } from './components/number-input/number-input';
import { RendererService } from './services/renderer-service';

@Component({
  selector: 'app-root',
  imports: [NumberInput],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
    protected renderService = inject(RendererService);
    protected canvasElement = viewChild<ElementRef<HTMLCanvasElement>>('canvas');


    ngAfterViewInit() {
        this.renderService.setCanvasContext(this.canvasElement()!.nativeElement.getContext('2d')!);
    }


    public updateLinkAngle(linkIndex: number, newAngle: number) {
        this.renderService.updateLinkAngle(linkIndex, newAngle);
    }
}
