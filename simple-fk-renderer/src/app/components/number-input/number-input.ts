import { Component, input, output } from '@angular/core';

@Component({
  imports: [],
  selector: 'number-input',
  styleUrl: './number-input.css',
  templateUrl: './number-input.html',
})
export class NumberInput {

    inputId = input.required<string>();
    label = input("Input Label");


    minValue = input<number>();
    maxValue = input<number>();
    stepSize = input(1);

    showValue = input(true);

    defaultValue = input<number>(0);
    onValueChange = output<number>();


    protected currentValue = this.defaultValue();

    protected onInputChange(event: Event) {
        this.currentValue = (event.target as HTMLInputElement).valueAsNumber;
        this.onValueChange.emit(this.currentValue);
    }
}
