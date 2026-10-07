import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'time-line',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './time_line.component.html',
  styleUrls: ['./time_line.component.css']
})
export class TimeLineComponent {
  // Riceve lo stato (es. 'Creata', 'In mobilità', ecc.)
  @Input() timeLineState?: string = '';
}