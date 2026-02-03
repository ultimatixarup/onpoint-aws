import { Component, OnInit } from '@angular/core';
import {LAYOUT_VERTICAL,LAYOUT_WIDTH, TOPBAR} from './layouts.model';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})

export class LayoutComponent implements OnInit {
  layoutType: string;
  layoutwidth: string;
  topbar: string;

  constructor() { }

  ngOnInit() {
    this.layoutType = LAYOUT_VERTICAL;
    this.layoutwidth = LAYOUT_WIDTH;
    this.topbar = TOPBAR;
    this.LayoutWidth(this.layoutwidth);
  }


  LayoutWidth(width: string) {
    switch (width) {
      default:
        document.body.setAttribute("data-layout-size", "fluid");
        break;
    }
  }

  isVerticalLayoutRequested() {
    return this.layoutType === LAYOUT_VERTICAL;
  }

}
