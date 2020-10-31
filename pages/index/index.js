const app = getApp()
const maskCanvas = wx.createCanvasContext('maskCanvas');
var phoneInfo = wx.getSystemInfoSync();
var pWidth = phoneInfo.windowWidth; //宽
var pHeight = phoneInfo.windowHeight; //高
var rPp = (750 / phoneInfo.windowWidth).toFixed(2); // rpx与px的宽高比
Page({
  data: {
    // 上传框的大小
    upInfo: {
      upW: 160,
      upH: 160,
      upT: 270,
      upL: 320,
    },
    // 上传的图片信息
    upImgInfo: {
      imgPath: '',
      imgW: 0,
      imgH: 0,
      upWPH: 0,
      angle: 0,
      imgLeft: 0,
      imgTop: 0,
    },
    // 背景图片信息
    bgImgInfo: {
      bgImgW: 0,
      bgImgH: 0,
      // 背景图宽与高的比
      wPh: 0
    },
    // 画布的信息
    canvasImgInfo: {
      canvasW: 0,
      canvasH: 0,
    },
    isUpload: false,
    touchOldX: 0,
    touchOldY: 0,
    touchNewX: 0,
    touchNewY: 0,
    successImg: '',
    showCanvas: false,
    // 明度与对比度初始值
    contrast: 100,
    brightness: 100,
  },
  onLoad: function (options) {
    let that = this;
    // 请求获取背景以及相关信息
    this.getRelated();
  },
  // 获取相关信息
  getRelated() {
    let that = this;
    this.getImgInfo('/image/bg.jpg').then(res => {
      let bgImgInfo = that.data.bgImgInfo;
      bgImgInfo.wPh = res.width / res.height;
      bgImgInfo.bgImgW = pWidth * rPp;
      bgImgInfo.bgImgH = pWidth / bgImgInfo.wPh * rPp;
      let canvasImgInfo = that.data.canvasImgInfo;
      canvasImgInfo.canvasW = 160 / rPp;
      canvasImgInfo.canvasH = 160 / rPp;
      that.setData({
        bgImgInfo: bgImgInfo,
        canvasImgInfo: canvasImgInfo,
      });
    })
  },
  // 封装方法获取图片的信息
  getImgInfo(src) {
    return new Promise(function (resolve, reject) {
      wx.getImageInfo({
        src: src,
        success(res) {
          resolve(res);
        }
      });
    })
  },
  //上传图片
  upload: function (e) {
    var that = this;
    wx.chooseImage({
      count: 1, // 默认9
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        let upImgInfo = that.data.upImgInfo;
        upImgInfo.imgPath = res.tempFilePaths[0];
        wx.getImageInfo({
          src: upImgInfo.imgPath,
          success: res => {
            let hCw = Number(res.width / res.height).toFixed(4);
            upImgInfo.imgW = 160;
            upImgInfo.imgH = 160 / hCw;
            upImgInfo.upWPH = Number(hCw)
            that.setData({
              upImgInfo: upImgInfo,
              isUpload: true,
            });
            that.calcDist();
          }
        })
      }
    })
  },
  // 计算图片的top/left
  calcDist() {
    let that = this;
    let upInfo = that.data.upInfo;
    let upImgInfo = that.data.upImgInfo;
    let poor = upInfo.upH - upImgInfo.imgH;
    upImgInfo.imgTop = poor / 2
    that.setData({
      upImgInfo: upImgInfo
    })
  },
  zoomIn() {
    if (!this.data.isUpload) {
      wx.showToast({
        title: '未上传图片',
        icon: 'none',
        duration: 2000
      })
      return;
    }
    let upImgInfo = this.data.upImgInfo;
    upImgInfo.imgW = upImgInfo.imgW + 3;
    upImgInfo.imgH = upImgInfo.imgH + 3 / upImgInfo.upWPH;
    this.setData({
      upImgInfo: upImgInfo
    });
  },
  zoomOut() {
    if (!this.data.isUpload) {
      wx.showToast({
        title: '未上传图片',
        icon: 'none',
        duration: 2000
      })
      return;
    }
    let upImgInfo = this.data.upImgInfo;
    upImgInfo.imgW = upImgInfo.imgW - 3;
    upImgInfo.imgH = upImgInfo.imgH - 3 / upImgInfo.upWPH;
    this.setData({
      upImgInfo: upImgInfo
    });
  },
  rotating() {
    if (!this.data.isUpload) {
      wx.showToast({
        title: '未上传图片',
        icon: 'none',
        duration: 2000
      })
      return;
    }
    let upImgInfo = this.data.upImgInfo;
    upImgInfo.angle = upImgInfo.angle + 90 == 360 ? 0 : upImgInfo.angle + 90
    this.setData({
      upImgInfo: upImgInfo
    });
  },
  // 重新上传
  againUpLoad() {
    if (!this.data.isUpload) {
      wx.showToast({
        title: '未上传图片',
        icon: 'none',
        duration: 2000
      })
      return;
    }
    this.upload();
  },
  dragtouchStart(e) {
    this.setData({
      touchOldX: e.touches[0].clientX,
      touchOldY: e.touches[0].clientY,
    });
  },
  dragtouchMove(e) {
    let upImgInfo = this.data.upImgInfo;
    let touchOldX = this.data.touchOldX,
      touchOldY = this.data.touchOldY;
    upImgInfo.imgTop += e.touches[0].clientY - touchOldY,
      upImgInfo.imgLeft += e.touches[0].clientX - touchOldX,
      this.setData({
        touchNewX: e.touches[0].clientX,
        touchNewY: e.touches[0].clientY,
        upImgInfo: upImgInfo,
        touchOldX: e.touches[0].clientX,
        touchOldY: e.touches[0].clientY
      })
  },
  dragtouchEnd() {
    console.log("拖动结束")
  },
  synthesis() { // 合成图片
    let that = this;
    let upImgInfo = that.data.upImgInfo;
    let canvasImgInfo = that.data.canvasImgInfo;
    maskCanvas.save();
    maskCanvas.beginPath();
    //一张白图  可以不画
    maskCanvas.setFillStyle('#fff');
    maskCanvas.fillRect(0, 0, canvasImgInfo.canvasW, canvasImgInfo.canvasH)
    maskCanvas.closePath();
    maskCanvas.stroke();
    //画背景 hCw 为 1.62 背景图的高宽比
    // maskCanvas.drawImage("/image/img1.png", upImgInfo.imgLeft/rPp, upImgInfo.imgTop/rPp, upImgInfo.imageW/rPp, upImgInfo.imageH/rPp);

    maskCanvas.translate(canvasImgInfo.canvasW / 2, canvasImgInfo.canvasH / 2);
    maskCanvas.rotate(upImgInfo.angle * Math.PI / 180);
    maskCanvas.translate(-canvasImgInfo.canvasW / 2, -canvasImgInfo.canvasH / 2);
    // maskCanvas.drawImage(upImgInfo.imgPath, upImgInfo.imgLeft / rPp, upImgInfo.imgTop / rPp, upImgInfo.imgW / rPp, upImgInfo.imgH / rPp);
    // var imgData = maskCanvas.getImageData(upImgInfo.imgLeft / rPp, upImgInfo.imgTop / rPp, upImgInfo.imgW / rPp, upImgInfo.imgH / rPp),
    //   data = imgData.data,
    //   avg = 0;
    // for (var i = 0; i < data.length; i += 4) {
    //   data[i] += 100;
    //   data[i + 1] += 100;
    //   data[i + 2] += 100;
    // }
    // maskCanvas.putImageData(imgData, 10, 10);
    maskCanvas.drawImage(upImgInfo.imgPath, upImgInfo.imgLeft / rPp, upImgInfo.imgTop / rPp, upImgInfo.imgW / rPp, upImgInfo.imgH / rPp);
    maskCanvas.draw();
    wx.canvasGetImageData({
      canvasId: 'maskCanvas',
      x: upImgInfo.imgLeft / rPp,
      y: upImgInfo.imgTop / rPp,
      width: upImgInfo.imgW / rPp,
      height: upImgInfo.imgH / rPp,
      success(res) {
        var pData = res.data;
        console.log(pData)
        for (var i = 0; i < pData.length; i += 10) {
          pData[i] += 200;
          pData[i + 1] += 200;
          pData[i + 2] += 200;
        }
        setTimeout(() => {
          console.log(pData)
          const data = new Uint8ClampedArray(pData);
          wx.canvasPutImageData({
            canvasId: 'maskCanvas',
            x: upImgInfo.imgLeft / rPp,
            y: upImgInfo.imgTop / rPp,
            width: upImgInfo.imgW / rPp,
            height: upImgInfo.imgH / rPp,
            data: data,
            success(res) {
              console.log(res)
              // maskCanvas.draw();
              setTimeout(function () {
                wx.canvasToTempFilePath({
                  canvasId: 'maskCanvas',
                  success: res => {
                    console.log(res.tempFilePath)
                    that.setData({
                      successImg: res.tempFilePath
                    })
                  }
                })
              }, 500)
            },
            fail(err){
              console.log(err)
              console.log("像素更改失败")
            }
          })
        }, 200)
      }
    });
  },
  openMask() {
    this.synthesis();
    this.setData({
      showCanvas: true
    })
  },
  // 明亮度
  SetBrightness(e) {
    let num = e.detail.progressText;
    this.setData({
      brightness: 50 + Number(num)
    });
  },
  // 对比度
  SetContrast(e) {
    let num = e.detail.progressText;
    this.setData({
      contrast: 50 + Number(num)
    });
  },
})