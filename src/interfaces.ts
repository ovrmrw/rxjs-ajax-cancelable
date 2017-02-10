import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'
import { AjaxResponse, AjaxRequest } from 'rxjs/observable/dom/AjaxObservable'

// export { AjaxResponse, AjaxRequest }


export type AjaxRequestPlus = AjaxRequest & {
  retry?: number,
  testing?: boolean,
}


export type AjaxResponsePlus = AjaxResponse & {
  processingTime?: number,
}


export interface AjaxObject {
  request: AjaxRequestPlus,
  response: AjaxResponsePlus | null,
  responseSubject$: Subject<AjaxResponsePlus | null>,
  retry: number,
}
