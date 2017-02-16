import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'
import { AjaxResponse, AjaxRequest } from 'rxjs/observable/dom/AjaxObservable'

export { AjaxResponse }


export type AjaxRequestOptions = AjaxRequest & {
  retry?: number,
  testing?: boolean,
  priorityFirst?: boolean,
}


export type AjaxResponsePlus = AjaxResponse & {
  processingTime?: number,
}


export interface AjaxObject {
  request: AjaxRequestOptions,
  response: AjaxResponsePlus | null,
  responseSubject$: Subject<AjaxResponsePlus | null>,
  retry: number,
  priorityFirst: boolean,
}
