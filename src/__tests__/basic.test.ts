import { Observable } from 'rxjs/Observable'
import { Subject } from 'rxjs/Subject'
import 'rxjs/add/observable/of'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/delay'

import { AjaxCancelable, AjaxRequestOptions, AjaxResponsePlus } from '../index'



class Action {
  private cancelable: AjaxCancelable

  constructor(request: AjaxRequestOptions) {
    this.cancelable = new AjaxCancelable(request)
  }

  requestTimestamp$(): Promise<AjaxResponsePlus> {
    return this.cancelable
      .requestAjax()
      .toPromise()
  }
}



describe('timeout: 1000', () => {
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

  it('will success', async () => {
    const data = await action.requestTimestamp$()
    expect(data.status).toBe(200)
    expect(data.response).toEqual({ name: 'Jack' })
  })
})


describe('timeout: 10', () => {
  let action: Action

  beforeEach(() => {
    action = new Action({
      method: 'GET',
      url: 'https://rxjs-ajax-cancelable-d2228.firebaseio.com/users/jack.json',
      crossDomain: true,
      timeout: 10,
      retry: 0,
      testing: true,
    })
  })

  it('will fail because of timeout', async () => {
    const data = await action.requestTimestamp$()
    expect(data.status).toBe(0)
  })
})
