import { Directive, Input, ComponentRef, ViewContainerRef, AfterViewInit, Compiler, ElementRef } from '@angular/core';
import { DynamicComponentConfiguration, IDynamicComponent } from './dynamic-options';
import { NgxDynamicRendererService } from './dynamic-renderer.svc';
import { JitCompilerFactory } from '@angular/platform-browser-dynamic';
import { isArray } from 'util';

export function createJitCompiler() {
	var jcf: any = JitCompilerFactory;

	return new jcf([{ useDebug: false, useJit: true }]).createCompiler();
}

@Directive({
	selector: '[dyn]',
	exportAs: 'dyn',
	providers: [
		{ provide: Compiler, useFactory: createJitCompiler, deps: [] },
	]
})
export class NgxDynamicDirective implements AfterViewInit {
	//  Fields
	protected compRefs: ComponentRef<IDynamicComponent>[];

	protected configs: DynamicComponentConfiguration[];

	//  Properties
	@Input('dyn')
	public set Config(config: DynamicComponentConfiguration | DynamicComponentConfiguration[]) {
		if (!isArray(config))
			config = [<DynamicComponentConfiguration>config];

		this.configs = <DynamicComponentConfiguration[]>config;
	}

	//	Constructors
	constructor(protected renderer: NgxDynamicRendererService, protected view: ViewContainerRef,
		protected compiler: Compiler, protected elmRef: ElementRef) {
		renderer.SetCompiler(compiler);
	}

	//	Life Cycle
	public ngAfterViewInit() {
		this.SetupView();
	}

	//  API Methods
	public SetupView() {
		if (this.configs && !this.compRefs) {
			this.view.clear();

			//this.Config.BypassCache = true;

			this.renderer.CompileTemplates(this.configs, this.view).then(
				(compRefs: ComponentRef<IDynamicComponent>[]) => {
					this.compRefs = compRefs;
				});

			//var config = this.configs[0];

			//this.renderer.RenderInnerHTML(this.elmRef, config.Template, config.Data);
		}
	}

	//	Helpers
}
