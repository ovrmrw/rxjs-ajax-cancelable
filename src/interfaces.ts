import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'
import { AjaxResponse, AjaxRequest } from 'rxjs/observable/dom/AjaxObservable'


export type AjaxRequestOptions = AjaxRequest & {
  retry?: number,
  testing?: boolean,
}


export type AjaxResponseOptions = AjaxResponse & {
  processingTime?: number,
}


export interface AjaxObject {
  request: AjaxRequestOptions,
  response: AjaxResponseOptions | null,
  responseSubject$: Subject<AjaxResponseOptions | null>,
  retry: number,
}
