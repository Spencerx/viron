import isObject from 'mout/lang/isObject';
import chart from '../../../../core/chart';

export default function() {
  const store = this.riotx.get();

  /**
   * Chartを更新します。
   */
  const updateChart = () => {
    const canvasElm = this.refs.canvas;
    if (!canvasElm) {
      return;
    }
    const data = this.data;
    chart.chart(canvasElm, data);
  };

  /**
   * OASに従いGETリクエストを送信します。
   * @return {Promise}
   */
  const getData = () => {
    return Promise
      .resolve()
      .then(() => {
        this.isLoading = true;
        this.update();
      })
      .then(() => Promise.all([
        // チカチカを防ぐ。
        new Promise(resolve => setTimeout(resolve, 300)),
        store.action('components.get', this.opts.id, this.opts.def)
      ]))
      .then(() => {
        this.isLoading = false;
        this.update();
      })
      .then(() => {
        updateChart();
      })
      .catch(err => {
        this.isLoading = false;
        if (err.status === 401) {
          this.error = '認証エラー。';
        } else {
          const api = this.opts.def.api;
          this.error = `[${api.method.toUpperCase()} ${api.path}]通信に失敗しました。`;
        }
        this.update();
      });
  };

  /**
   * レスポンスデータの正当性をチェックします。
   * @param {Object} data
   * @return {String|null}
   */
  const validate = data => {
    if (!isObject(data)) {
      return 'レスポンスデータに誤りがあります。';
    }
    return null;
  };

  // 通信レスポンス内容。
  this.data = null;
  // 通信中か否か。
  this.isLoading = true;
  // エラーメッセージ。
  this.error = null;
  // 自動更新間隔。
  this.autoRefreshSec = null;
  let autoRefreshIntervalId = null;
  const activateAutoRefresh = () => {
    if (!this.autoRefreshSec) {
      return;
    }
    if (autoRefreshIntervalId) {
      return;
    }
    autoRefreshIntervalId = window.setInterval(() => {
      getData();
    }, this.autoRefreshSec * 1000);
  };
  const inactivateAutoRefresh = () => {
    window.clearInterval(autoRefreshIntervalId);
    autoRefreshIntervalId = null;
  };

  this.listen(this.opts.id, () => {
    this.data = store.getter('components.response', this.opts.id);
    this.error = validate(this.data);
    this.autoRefreshSec = store.getter('components.autoRefreshSec', this.opts.id);
    activateAutoRefresh();
    this.update();
  });
  this.refreshId = store.getter('util.components_refresh');
  this.listen('util', () => {
    const refreshId = store.getter('util.components_refresh');
    if (this.refreshId !== refreshId) {
      this.refreshId = refreshId;
      getData();
    }
  });


  this.on('mount', () => {
    getData();
  }).on('unmount', () => {
    inactivateAutoRefresh();
    store.action('components.remove', this.opts.id);
  });
}
