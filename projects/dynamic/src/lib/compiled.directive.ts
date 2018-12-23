import { Directive, Input, ComponentRef, ViewContainerRef, AfterViewInit, Compiler, ElementRef } from '@angular/core';
import { DynamicComponentConfiguration, IDynamicComponent } from './dynamic-options';
import { isArray } from 'util';

@Directive({
	selector: '[compiled]',
	exportAs: 'compiled',
})
export class NgxCompiledDirective implements AfterViewInit {
	//  Fields
	protected compRefs: ComponentRef<IDynamicComponent>[];

	protected configs: DynamicComponentConfiguration[];

	//  Properties
	@Input('compiled')
	public set Config(config: DynamicComponentConfiguration | DynamicComponentConfiguration[]) {
		if (!isArray(config))
			config = [<DynamicComponentConfiguration>config];

		this.configs = <DynamicComponentConfiguration[]>config;
	}

	//	Constructors
	constructor(/*protected pageCompilerSvc: PageCompilerService, */protected view: ViewContainerRef) {
	}

	//	Life Cycle
	public ngAfterViewInit() {
		// this.pageCompilerSvc.ComponentFactories.subscribe(
		// 	(factories) => {
		// 		if (factories) {
		// 			this.view.clear();

		// 			var compRefs = [];

		// 			this.configs.forEach(
		// 				(config) => {
		// 					if (config.Selector) {
		// 						var compRef = this.view.createComponent(factories.get(config.Selector));

		// 						compRefs.push(compRef);

		// 						compRef.changeDetectorRef.detectChanges();
		// 					}
		// 				});
		// 		}
		// 	});
	}

	//  API Methods

	//	Helpers
}
