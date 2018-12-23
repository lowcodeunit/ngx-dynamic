import { Component } from "@angular/core";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent {
  //  Properties
  public Content: string;

  public Data: any;

  //  Constructors
  constructor() {
    this.Content = `<a mat-button>Hello</a>`;

    this.Data = {
      Hello: "World"
    };
  }
}
