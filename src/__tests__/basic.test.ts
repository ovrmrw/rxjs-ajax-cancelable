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

  requestTimestamp$(): Observable<number> {
    return this.cancelable
      .requestAjax() // type is Observable<AjaxResponsePlus>
      .map(data => data.response)
      .map(res => res.st as number)
      .map(value => value * 1000)

  }
}



describe('timeout: 1000', () => {
  let action: Action

  beforeEach(() => {
    action = new Action({
      method: 'GET',
      url: 'https://ntp-a1.nict.go.jp/cgi-bin/json',
      crossDomain: true,
      timeout: 1000 * 10,
      testing: true,
    })
  })

  it('will success', async () => {
    const timestamp = await action.requestTimestamp$().toPromise()
    expect(timestamp).toBeGreaterThan(0)
  })
})


describe('timeout: 10', () => {
  let action: Action

  beforeEach(() => {
    action = new Action({
      method: 'GET',
      url: 'https://ntp-a1.nict.go.jp/cgi-bin/json',
      crossDomain: true,
      timeout: 10,
      retry: 0,
      testing: true,
    })
  })

  it('will fail because of timeout', async () => {
    const timestamp = await action.requestTimestamp$().toPromise()
    expect(timestamp).toBeUndefined()
  })
})
