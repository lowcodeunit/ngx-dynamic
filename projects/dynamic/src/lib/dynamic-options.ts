import { Type, InjectionToken, ModuleWithProviders } from '@angular/core';

export interface IComponentWithSelector {
	Selector: string;

	Component: Type<any>;
}

export interface IModuleWithName {
	Name: string;

	Hook: any;
}

export abstract class OnMount {
	abstract dynamicOnMount(attrs?: Map<string, string>, content?: string, element?: Element): void;
}

export interface INgxDynamicRef {
	Check: () => void;

	Destroy: () => void;
}

export class NgxDynamicOptions {
	public Components: IComponentWithSelector[];

	public Modules: any[];
}

export class PageCompilerOptions {
	public Modules: Type<any>[] | ModuleWithProviders[] | any[];
}

export interface IDynamicComponent {
	EvaluateCustomCode: (exports: string) => void;
}

export class DynamicComponentConfiguration {
	public BypassCache: boolean;

	public Data: any;

	public Exports: string;

	public Host: { [key: string]: string };

	public Selector: string;

	public Services: { [key: string]: Type<any> | InjectionToken<any> };

	public Template: string;
}
