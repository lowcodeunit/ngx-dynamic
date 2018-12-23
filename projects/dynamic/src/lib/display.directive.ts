import { Directive, Input, OnInit, ViewContainerRef, ComponentFactoryResolver, AfterViewInit, Type } from '@angular/core';

@Directive({
	selector: '[ngx-display]',
	exportAs: 'display'
})
export class NgxDisplayDirective implements OnInit {
	//	Properties
	@Input('Ngx-display')
	public Component: Type<any>;

	@Input('context')
	public Context: any;

	//	Constructors
	constructor(protected view: ViewContainerRef, protected componentFactoryResolver: ComponentFactoryResolver) {
	}

	//	Life Cycle
	public ngOnInit() {
		try {
			if (this.Component) {
				let componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.Component);

				this.view.clear();

				let compRef = this.view.createComponent(componentFactory);

				this.updateCompileProperties(compRef.instance);
			}
		} catch (err) {
			console.log(err);
		}
	}

	//	API Methods

	//	Helpers
	protected updateCompileProperties(compRefInstance: any) {
		if (this.Context)
			for (var prop in this.Context) {
				try {
					compRefInstance[prop] = this.Context[prop];
				} catch (err) { }
			}
	}
}
