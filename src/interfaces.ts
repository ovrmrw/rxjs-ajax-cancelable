import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'
import { AjaxResponse, AjaxRequest } from 'rxjs/observable/dom/AjaxObservable'

export { AjaxResponse, AjaxRequest }


export type AjaxRequestPlus = AjaxRequest & {
  retry?: number
}


export interface AjaxObject {
  request: AjaxRequest,
  response: AjaxResponse | null,
  responseSubject$: Subject<AjaxResponse | null>,
  retry: number,
}
