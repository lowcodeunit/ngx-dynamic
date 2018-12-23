import { Component, ElementRef, Input, SimpleChanges, OnChanges, OnDestroy, DoCheck } from '@angular/core';
import { NgxDynamicRendererService } from './dynamic-renderer.svc';
import { INgxDynamicRef } from './dynamic-options';

@Component({
	selector: 'ngx-dynamic',
	templateUrl: './dynamic.component.html',
	styleUrls: ['./dynamic.component.scss'],
})
export class NgxDynamicComponent implements DoCheck, OnChanges, OnDestroy  {
	//  Fields
	private ref: INgxDynamicRef = null;

	//  Properties
	@Input('content')
	public Content: string;

	@Input('data')
	public Data: any;

	//  Constructors
	constructor(protected renderer: NgxDynamicRendererService, protected elementRef: ElementRef) {
	}

	//	Life Cycle
	public ngOnChanges(_: SimpleChanges) {
		if (this.ref) {
			this.ref.Destroy();

			this.ref = null;
		}

		if (this.Content && this.elementRef)
			this.ref = this.renderer.RenderInnerHTML(this.elementRef, this.Content, this.Data);
	}

	public ngDoCheck() {
		if (this.ref)
			this.ref.Check();
	}

	public ngOnDestroy() {
		if (this.ref) {
			this.ref.Destroy();

			this.ref = null;
		}
	}

	//	API Methods

	//	Helpers
}
