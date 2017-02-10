// 'https://rxjs-ajax-cancelable-d2228.firebaseio.com/.json?download=file.txt'


import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'
import 'rxjs/add/observable/of'
import 'rxjs/add/observable/interval'

import 'rxjs/add/operator/map'
import 'rxjs/add/operator/delay'
import 'rxjs/add/operator/do'


import { AjaxCancelable, AjaxRequestPlus, AjaxResponsePlus } from '../index'



class Action {
  private cancelable: AjaxCancelable

  constructor(request: AjaxRequestPlus) {
    this.cancelable = new AjaxCancelable(request)
  }

  requestDownload$(): Observable<AjaxResponsePlus> {
    return this.cancelable
      .requestAjax()
    // .do(data => console.log(data))
    // .map(data => data.response)
  }
}


describe('Firebase test', () => {
  let action: Action

  beforeEach(() => {
    action = new Action({
      method: 'GET',
      url: 'https://rxjs-ajax-cancelable-d2228.firebaseio.com/users/jack.json',
      crossDomain: true,
      timeout: 1000 * 10,
      testing: true,
    })
  })

  it('get json', async () => {
    const res = await action.requestDownload$().toPromise()
    expect(res.status).toBe(200)
    expect(res.responseType).toBe('json')
    expect(res.response).toEqual({ name: 'Jack' })
  })

})
