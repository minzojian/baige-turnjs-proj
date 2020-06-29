window.requestAnimationFrame =
  window.requestAnimationFrame ||
  function(fn) {
    return setTimeout(fn, 1000 / 60);
  };
window.cancelAnimationFrame = window.cancelAnimationFrame || clearTimeout;

"Element" in this &&
  !("addEventListener" in this.Element.prototype) &&
  (function(global) {
    function Event(e, element) {
      var instance = this;

      for (property in e) {
        instance[property] = e[property];
      }

      instance.currentTarget = element;
      instance.target = e.srcElement || element;
      instance.timeStamp = +new Date();

      instance.preventDefault = function() {
        e.returnValue = false;
      };
      instance.stopPropagation = function() {
        e.cancelBubble = true;
      };
    }

    function addEventListener(type, listener) {
      var element = this,
        listeners = (element.listeners = element.listeners || []),
        index =
          listeners.push([
            listener,
            function(e) {
              listener.call(element, new Event(e, element));
            }
          ]) - 1;

      element.attachEvent("on" + type, listeners[index][1]);
    }

    function removeEventListener(type, listener) {
      for (
        var element = this,
          listeners = element.listeners || [],
          length = listeners.length,
          index = 0;
        index < length;
        ++index
      ) {
        if (listeners[index][0] === listener) {
          element.detachEvent("on" + type, listeners[index][1]);
        }
      }
    }

    global.addEventListener = document.addEventListener = global.Element.prototype.addEventListener = addEventListener;
    global.removeEventListener = document.removeEventListener = global.Element.prototype.removeEventListener = removeEventListener;
  })(this);

var supportOrientation =
  typeof window.orientation === "number" &&
  typeof window.onorientationchange === "object";

var orientationValue;
var updateOrientation = function() {
  if (supportOrientation) {
    switch (window.orientation) {
      case 90:
      case -90:
        orientationValue = "landscape";
        break;
      default:
        orientationValue = "portrait";
        break;
    }
  } else {
    orientationValue = windowWidth > windowHeight ? "landscape" : "portrait";
  }
  if (!IsPC()) {
    if (orientationValue == "portrait") {
      $("body")
        .addClass("single-page")
        .removeClass("double-page");
      setDisplay("single");
      // $(".flipbook").turn("display", "single");
      padding = 10;
    } else {
      $("body")
        .removeClass("single-page")
        .addClass("double-page");
      setDisplay("double");
      // $(".flipbook").turn("display", "double");
      padding = 100;
    }
    requestAnimationFrame(function() {
      rescalePages();
      centerFlipbook();
    });
  }
};

if (supportOrientation) {
  window.addEventListener("orientationchange", updateOrientation, false);
} else {
  //监听resize事件
  window.addEventListener("resize", updateOrientation, false);
}

var isOldBrowser = false;
function setOldBrowser() {
  isOldBrowser = true;
}

function setDisplay(mode) {
  if (!isEditorMode || previewMode) $(".flipbook").turn("display", mode);
}

function loadApp() {
  if (isOldBrowser) {
    $(".loading-pic").hide();
    $(".loading-tips").show();

    return;
  }

  // Create an instance of Hammer with the reference.
  // if(!IsPC()){
  window.hammer = new Hammer(document.querySelector(".flipbook"));
  // hammer.get("pinch").set({ enable: true });
  // hammer.on("pinch", function(ev) {
  //   if (ev.additionalEvent == "pinchin") {
  //     requestAnimationFrame(zoomout);
  //   } else if (ev.additionalEvent == "pinchout") {
  //     requestAnimationFrame(zoomin);
  //   }
  //   console.log(ev);
  // });

  // hammer.on("doubletap", function(ev) {
  //   zoomToggle();
  // })

  hammer.on("swipeleft", function(event) {
    if (!isEditorMode && getZoom() <= 1.1) pageDown();
  });
  hammer.on("swiperight", function(event) {
    if (!isEditorMode && getZoom() <= 1.1) pageUp();
  });

  // }

  //if(!IsPC())
  //{
  //$('body').bind('pinch',function(){alert(arguments)});

  // $('.flipbook-viewport').bind('tapone',function(){alert(arguments)});
  //}

  //init img
  bookId = getBookId(bookId);
  //  getImgList(bookId,pageNo,pageSize);

  // var w = $(window).width();
  // console.log("width:" + w);
  // var h = $(window).height();
  // console.log("height:" + h);
  // $(".container").width(w).height(h);
  // $(".flipbook").width(w).height(h);
  //判断是否手机
  // pcFlag = IsPC();
  // var display = "single";
  // if (pcFlag) {
  //   display = "double";
  // }




  // And pass it to panzoom
  window.panzoomer = panzoom(document.querySelector(".flipbook-viewport"), {
    minZoom: 1,
    maxZoom: maxZoom,
    transformOrigin: { x: 0.5, y: 0.5 },

    //smoothScroll: false,
    // autocenter:true,
    panAble: false,
    dbClickZoomAble: false,
    beforeMouseDown: function(e) {
      return false;
    },
    beforeWheel:function(e)
    {
      if (isEditorMode) return false;
    },
    onDoubleClick: function(e) {
      if (isEditorMode) return false;
      if (zoomToggle()) {
        hammer.set({ enable: false });
      }
      return false;
    },
    onTouch: function(e) {
      return false; // tells the library to not preventDefault.
    },
    // boundsPadding: 0.1,
    boundsOffset: {
      x: (windowWidth - docWidth * documentZoom) / 2,
      y: (windowHeight - docHeight * documentZoom) / 2
    },
    bounds: { top: 0, right: windowWidth, bottom: windowHeight, left: 0 }
    //   beforeMouseDown: function(e) {
    //   // allow mouse-down panning only if altKey is down. Otherwise - ignore
    //   var shouldIgnore = !e.altKey;
    //   return shouldIgnore;
    // }
  });

  var lastPanAble = false;
  panzoomer.on("transform", function(e) {
    if(getZoom()>1)
    {
      showZoomPanel();
    }else{
      hideZoomPanel();
    }

    $(".flipbook-controls .zoom-panel .zoom-slider").slider({
      value: getZoom()
    });

    var nowPanAble = isPanAble();
    if (!IsPC()) {
      if (lastPanAble && !nowPanAble) {
        showBars();

        zoomReset();
      } else if (!lastPanAble && nowPanAble) {
        hideBars();
      }
    }

    hammer.set({ enable: !nowPanAble });
    panzoomer.setOptions("panAble", nowPanAble);
    lastPanAble = nowPanAble;
    // Note: e === instance.
  });



  // Create the flipbook
  $(".flipbook").turn({
    // Width
    // width: w,
    // Height
    // height: h,
    // docWidth: 1488,
    // docHeight: 2020,
    //turnCorners: "", //"bl,br",
    duration: 500,
    // Elevation
    elevation: 100,
    // Enable gradients
    gradients: true,
    // display: display,
    pages: pages,
    // Auto center this flipbook
    autoCenter: true,
    display: IsPC() && !isEditorMode ? "double" : "single",

    when: {
      start: function(event, page, view) {
        var book = $(this),
          currentPage = book.turn("page"),
          pages = book.turn("pages");
        // unselectClip();
        // console.log('start',page);
      },
      turning: function(event, page, view) {
        var book = $(this),
          currentPage = book.turn("page"),
          pages = book.turn("pages");

        // Update the current URI

        if (IsPC()) Hash.go(page).update();

        // console.log('turning',page);

        // Show and hide navigation buttons
      },

      turned: function(event, page, view) {
        $(this).turn("center");

        // console.log('turned',page);
        // $('#slider').slider('value', getViewNumber($(this), page));

        if (page == 1) {
          $(this).turn("peel", "br");
        }
        rescalePages();
        centerFlipbook();

        updatePageInfo();
        unselectClip();
        updateClips(page);
        
      },

      missing: function(event, pages) {
        // Add pages that aren't in the demo

        for (var i = 0; i < pages.length; i++) addPage(pages[i], $(this));
      },
      zooming: function(event, newZoom, zoom) {
        // $(".flipbook").addClass("non-animated")
        rescalePages();
        centerFlipbook();
        // requestAnimationFrame(function() {
        //   rescalePages();
        // });

        // $(this).turn("center");
      }
    }
  });

  $("#videoClipPopup").dialog({
    modal: true,
    autoOpen: false,
    width: windowWidth / 4,
    maxWidth: windowWidth / 2,
    maxHeight: windowHeight / 2,
    position: { my: "center", at: "center center-100", of: "#maindiv" },
    close: function(event, ui) {
      $("#videoClipPopup").empty();
    }
  });

  //   if(!IsPC()){

  //   $(".flipbook").click(function(){
  //     let showBar=$(".flipbook-controls").data('show')
  //     if(showBar){

  //     }else{

  //     }
  //     requestAnimationFrame(function() {
  //       rescalePages();
  //       centerFlipbook();
  //     });
  //   })
  // }

  function hideBars() {
    if (IsPC()) return;
    // paddingV=padding;
    $(".flipbook-header").hide();
    $(".flipbook-controls")
      .data("show", false)
      .hide();

    // requestAnimationFrame(function() {
    //   rescalePages();
    //   centerFlipbook();
    // });
  }
  function showBars() {
    if (IsPC()) return;
    // paddingV=100;
    $(".flipbook-header").show();
    $(".flipbook-controls")
      .data("show", true)
      .show();

    // requestAnimationFrame(function() {
    //   rescalePages();
    //   centerFlipbook();
    // });
  }

  $(".flipbook-controls .zoom-panel .zoom-slider").slider({
    value: 1
  });

  $("#flipbook").bind("last", function(event) {
    console.log("最后一页");
  });

  // $(".flipbook").bind("end", function (event, pageObject, turned) {
  //   if (turned) {
  //     dealNextPageData(pageObject.next);
  //   }
  //   // alert("turn.end:" +pageObject.page);
  // });

  document.title = docTitle;
  $(".flipbook-title").text(docTitle);

  var fullScreenAble =
    document.documentElement.requestFullScreen ||
    document.documentElement.webkitRequestFullScreen ||
    document.documentElement.mozRequestFullScreen ||
    document.documentElement.msRequestFullScreen;

  if (!fullScreenAble) {
    $(".flipbook-controls .fullscreenBt").hide();
  }

  function launchFullscreen(element) {
    element = element || document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullScreen();
    }
  }

  function exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }

  document.addEventListener("fullscreenchange", function(e) {
    if (document.fullscreenElement) {
      $(".flipbook-controls .fullscreenBt")
        .removeClass("icon-full-screen")
        .addClass("icon-full-screen-off")
        .attr({ title: "退出全屏" });
      console.log("进入全屏");
    } else {
      $(".flipbook-controls .fullscreenBt")
        .addClass("icon-full-screen")
        .removeClass("icon-full-screen-off")
        .attr({ title: "进入全屏" });
      console.log("退出全屏");
    }
  });

  $(".flipbook-controls .fullscreenBt").attr({ title: "进入全屏" });

  $(".flipbook-controls .fullscreenBt").click(function() {
    if (document.fullscreenElement) {
      exitFullscreen();
    } else {
      launchFullscreen();
    }
  });

  $(".flipbook-controls .zoom-panel-wraper .zoom-in").click(function() {
    zoomin();
  });
  $(".flipbook-controls .zoom-panel-wraper .zoom-out").click(function() {
    zoomout();
  });
  $(".flipbook-controls .zoomBt").attr({ title: "放大/缩小" });
  $(".flipbook-controls .zoomBt").click(function() {
    if ($(".flipbook-controls .zoom-panel-wraper").is(":visible")) {
      zoomReset();
    } else {
      showZoomPanel();
      zoomin();
    }
  });



  // $(".flipbook-viewport").bind("zoom.swipeLeft", function(event) {
  //   pageDown();
  // });
  // $(".flipbook-viewport").bind("zoom.swipeRight", function(event) {
  //   pageUp();
  // });

  // if (!isOldBrowser) {
  //   $(".flipbook-viewport").zoom({
  //     flipbook: $(".flipbook"),
  //     max: function() {
  //       return 2;
  //     },

  //     when: {
  //       swipeLeft: function() {
  //         $(".flipbook").turn("next");
  //       },

  //       swipeRight: function() {
  //         $(".flipbook").turn("previous");
  //       }

  //       // resize: function (event, scale, page, pageElement) {
  //       //   // if (scale==1)
  //       //   // 	loadSmallPage(page, pageElement);
  //       //   // else
  //       //   // 	loadLargePage(page, pageElement);
  //       //   requestAnimationFrame(rescalePages);
  //       // },

  //       //   zoomIn: function () {

  //       //   	$('.made').hide();
  //       //   	$('.flipbook').removeClass('animated').addClass('zoom-in');
  //       //   	$('.zoom-icon').removeClass('zoom-icon-in').addClass('zoom-icon-out');

  //       //   	if (!window.escTip && !$.isTouch) {
  //       //   		escTip = true;

  //       //   		$('<div />', {'class': 'exit-message'}).
  //       //   			html('<div>按ESC退出放大效果</div>').
  //       //   				appendTo($('body')).
  //       //   				delay(2000).
  //       //   				animate({opacity:0}, 500, function() {
  //       //   					$(this).remove();
  //       //   				});
  //       //   	}
  //       //   },

  //       //   zoomOut: function () {

  //       //   	$('.exit-message').hide();
  //       //   	$('.made').fadeIn();
  //       //   	$('.zoom-icon').removeClass('zoom-icon-out').addClass('zoom-icon-in');

  //       //   	setTimeout(function(){
  //       //   		$('.flipbook').addClass('animated').removeClass('zoom-in');
  //       //   		resizeViewport();
  //       //   	}, 0);

  //       //   }
  //     }
  //   });
  // }

  $(document).keydown(function(e) {
    switch (e.keyCode) {
      case 37: //left
      case 38: //top
        // left arrow
        if (!isEditorMode) {
          pageUp();
          e.preventDefault();
        }

        break;
      case 39: //right
      case 40: //down
        //right arrow
        if (!isEditorMode) {
          pageDown();
          e.preventDefault();
        }

        break;
      case 27: //esc
        // $(".flipbook-viewport").zoom("zoomOut");
        zoomOut();
        e.preventDefault();

        break;
    }
  });

  Hash.on("^([0-9]*)$", {
    yep: function(path, parts) {
      var page = parts[1];

      if (!!page && !isNaN(page)) {
        if ($(".flipbook").turn("is")) $(".flipbook").turn("page", page);
      }
    },
    nop: function(path) {
      if ($(".flipbook").turn("is")) $(".flipbook").turn("page", 1);
    }
  });

  

  updateOrientation();
  resizeViewport();

  $(".pageLoading")
    .delay(1000)
    .hide("fade", {}, 100, function() {
      $(this).remove();
    }); //.remove();

  $(window)
    .resize(function() {
      windowWidth =
        window.innerWidth ||
        Math.max(
          document.documentElement.clientWidth,
          document.body.clientWidth
        );
      windowHeight =
        window.innerHeight ||
        Math.max(
          document.documentElement.clientHeight,
          document.body.clientHeight
        );
      requestAnimationFrame(resizeViewport);
    })
    .bind("orientationchange", function() {
      requestAnimationFrame(resizeViewport);
    });
}

//end of load app


function showZoomPanel()
{
  $(".flipbook-controls .zoomBt")
  .addClass("icon-zoom-out")
  .removeClass("icon-zoom-in");
$(".flipbook-controls .zoom-panel-wraper").show();
$(".flipbook-controls .zoom-panel .zoom-slider").slider({
  min: 1,
  max: 2,
  step: 0.01,
  slide: function(event, ui) {
    zoomFlipbook(ui.value, true);
    // console.log(ui.value );
  }
});

}
function hideZoomPanel(){
  $(".flipbook-controls .zoom-panel-wraper").hide();
  $(".flipbook-controls .zoomBt")
    .addClass("icon-zoom-in")
    .removeClass("icon-zoom-out");
  isMaxZoom = false;
}


//start of clips

//文档中的贴片数据

//var clips = [];
//测试用
var clips = [
  {
    bookId:1,
    id: 1,
    type: "video",
    autoplay: true,
    inline: false,
    url: "5285890800802084431",
    coverUrl:"http://1251142715.vod2.myqcloud.com/31e1a8aevodtranssh1251142715/7f991ba05285890800802084431/1586588442_2839370066.100_0.jpg",
    pageNumber: 1,
    x: 100,
    y: 100,
    width: 200,
    height: 150
  },
  {
    bookId:1,
    id: 2,
    type: "video",
    autoplay: false,
    inline: true,
    url: "5285890800802084431",
    coverUrl:"http://1251142715.vod2.myqcloud.com/31e1a8aevodtranssh1251142715/7f991ba05285890800802084431/1586588442_2839370066.100_0.jpg",
    pageNumber: 1,
    x: 250,
    y: 200,
    width: 200,
    height: 200
  },
  {
    bookId:1,
    id: 3,
    type: "link",
    href: false,
    to: "4",
    pageNumber: 1,
    x: 450,
    y: 400,
    width: 100,
    height: 100
  },
  {
    bookId:1,
    id: 4,
    type: "link",
    href: true,
    to: "http://baidu.com",
    pageNumber: 1,
    x: 550,
    y: 500,
    width: 100,
    height: 100
  }
];

function loadClips() {
  if (needPassword) {
    $(".pageLoading").hide("fade", {}, 100, function() {
      $(this).remove();
    });

    $("#passwordPopup").dialog({
      classes: {
        "ui-dialog": "ui-corner-all",
        "ui-dialog-titlebar": "ui-corner-all noclosePopup"
      },
      closeOnEscape: false,
      modal: true,
      autoOpen: true,
      title: "需要密码",
      width: 320,
      resize: false,
      position: { my: "center", at: "center center-100", of: "#maindiv" }
    });
  } else {
    try {
      $("#passwordPopup")
        .dialog("destroy")
        .hide();
    } catch (e) {}

    //加载视频和链接贴片的两个接口，clips/video和clips/link
    //加载两种贴片,合并到clips中去(暂时关闭)
    // clips = [];
    // return Promise.all([
    // $.ajax({ url: 'clips/video' }),
    //   $.ajax({ url: 'clips/link' })]).then(function ([videos, links]) {
    //     clips.push.apply(null,videos.map(function (video) {
    //         return {...video,type:"video"}
    //     }))
    //     clips.push.apply(null,links.map(function (link) {
    //       return {...link,type:"link"}
    //   }))
    //  loadApp();
    // })

    loadApp();
  }
}

var isReeditVideoUrl = false;
function addVideoClip(e, reeditMode) {
  isReeditVideoUrl = reeditMode;
  $("#addVideoUrlPop").dialog({
    modal: true,
    autoOpen: true,
    title: "视频链接",
    width: 320,
    resize: false,
    position: { my: "center", at: "center center-100", of: "#maindiv" }
  });
}
function addLinkClip() {
  addClip("link");
}

function addVideoCheck() {
  var videoUrl = $("#needCheckVideoUrl").val();
  if (!videoUrl) showMessage("请输入地址");
  if (new URL(videoUrl).host.indexOf(".baige.me") == -1)
    showMessage("仅支持百鸽视频播放地址");

  //这里验证一下视频链接
  $("#addVideoUrlPop button").attr("disabled", true);
  $("#addVideoUrlPop .notice").show();
  var id = /i=(.*)/gi.exec(videoUrl)[1];
  //获取视频文件id的接口
  $.ajax({
    url: `http://player.baige.me/api/getVideo?url=${videoUrl}`,
    contentType: "text",
    type: "GET",
    crossDomain: true,
  })
    .done(function (res)
    {
      console.log(res.data);

      // videoUrl = $(res.data).find("video").attr("src");
      videoUrl=res.data.fileId
      var coverUrl=res.data.coverUrl
  
  // videoUrl = "5285890800802084431";

  if (!isReeditVideoUrl) {
    addClip("video", videoUrl,coverUrl);
  } else if (selectedClipId) {
    getClip(selectedClipId).url = videoUrl;
    selectClip(selectedClipId);
  }
  $("#addVideoUrlPop button").attr("disabled", false);
  $("#addVideoUrlPop .notice").hide();
  }
  )
  .error(function (err) {
    $("#addVideoUrlPop button").attr("disabled", false);
    $("#addVideoUrlPop .notice").text("加载失败，请重试");
  });
  $("#addVideoUrlPop")
    .dialog("destroy")
    .hide();
}

//当前选中的贴片ID
var selectedClipId;

function updateClips(page) {
  if (!page) page = $(".flipbook").turn("page");
  var pageRanges = [page]; // $(".flipbook").turn("range");
  pageRanges.forEach(function(page) {
    var foundClips = clips.filter(function(clip) {
      return clip.pageNumber == page;
    });
    $(".flipbook .page.p" + page + " .clip-container").empty();
    foundClips.forEach(function(clip) {
      var x = clip.x;
      var y = clip.y;
      var width = clip.width;
      var height = clip.height;
      var normalMode = !isEditorMode || previewMode;
      var content = `<div data-clip-id='${clip.id}' class="${
        !isEditorMode ? "normal-clip" : ""
      } doc-clip ${
        clip.type
      }-clip" style="left:${x}px;top:${y}px;width:${width}px;height:${height}px;
      ${
        clip.type != "video" || !clip.inline
          ? clip.type == "video"
            ? "background:rgba(40,40,255,0.5)"
            : "background:rgba(255,40,40,0.5)"
          : "background:rgba(0,0,0,0)"
      }
      ">
      
      
      </div>`;

      // ${
      //   isEditorMode && !previewMode
      //     ? '<span class="edit-icon iconfont icon-edit" /> '
      //     : ""
      // }
      

      if (normalMode && clip.type == "link") {
        var linkContent = `<div style="position:absolute;width:100%;height:100%;display:flex;justify-content:center;align-items:center;padding:8px">
        <span class=" action-bt link-icon iconfont icon-link"   />
        </div>`;
        // if (clip.mode == 'page') {
        //   content = $(content).append(linkContent);
        // } else {
        //   content = `<a href='${clip.url}' target="_blank">${content}${linkContent}</a>`;
        // }
        content = $(content).append(linkContent);
      } else if ( clip.type == "video") {
        var videoContent,actionBtContent;
          if(normalMode){
        //如果是嵌入式，直接插入进去
        //<span class="mute-icon iconfont icon-mute"   />
        var videoUrl = `http://player.baige.me/vod?i=${clip.url}&autoplay=${
          clip.autoplay ? "true" : "false"
        }&width=${width}&height=${height}`;
        //videoUrl = ""; //https://baidu.com";
         videoContent = `<iframe class="video-content" src="${videoUrl}" 
        frameborder="0" scrolling="no" width="${width}" 
        height="${height}" allowfullscreen > </iframe>`;

        // `<video width=${width} height=${height} ${
        //   clip.autoplay ? "autoplay" : ""
        // } src='${clip.url}' loop />`;
        actionBtContent = `<div style="position:absolute;width:100%;height:100%;display:flex;justify-content:center;align-items:center;padding:8px">
        <span class=" action-bt play-icon iconfont ${
          clip.inline && clip.autoplay ? "icon-pause" : "icon-play"
        }"   />
        </div>
        `;
      }else{
        videoContent = `<img class="video-content" style="background: black;width:100%;height:100%;object-fit:contain" src="${clip.coverUrl}" > </img>`;
        actionBtContent = clip.inline?`<div style="pointer-event:none;position:absolute;width:100%;height:100%;display:flex;justify-content:center;align-items:center;padding:8px">
        <span class=" action-bt play-icon iconfont ${
          clip.inline && clip.autoplay ? "icon-pause" : "icon-play"
        }"   />
        </div>
        `:"";
      }

        if (clip.inline) content = $(content).append(videoContent);
        content = $(content).append(actionBtContent);
      }

      $(".flipbook .page.p" + page + " .clip-container").append(content);
    });
  });
}
function addClip(type, url,coverUrl) {
  let id = uuidv4;
  clips.push({
    bookId:docId,
    id: id,
    type: type,
    autoplay: true,
    inline: true,
    url: url || "",
    coverUrl:coverUrl,
    to: url,
    pageNumber: $(".flipbook").turn("page"),
    x: 100,
    y: 100,
    width: 100,
    height: 100,
    isTemp: true,
    dirty: true
  });
  updateClips($(".flipbook").turn("page"));
  selectClip(id);
}

//保存贴片
function saveClips() {
  var clip = syncClip();

  var videoClips = clips.filter(function(clip) {
    return clip.type == "video" && clip.dirty;
  });
  var linkClips = clips.filter(function(clip) {
    return clip.type == "link" && clip.dirty;
  });

  var posts = [];
  if (videoClips.length > 0) {
    //保存视频贴片的接口videoClips/save
    videoClips.forEach(function(clip)
    {
      posts.push(
        $.ajax({
          url: "http://m.baige.me/api/add/saveVideo",
          contentType:"application/json",
          data: JSON.stringify( clip),
          type: "post"
        })
      );
    })
    
  }
  if (linkClips.length > 0) {
    //保存链接贴片的接口linkClips/save
    linkClips.forEach(function(clip)
    {
    posts.push(
      $.ajax({
        url: "http://m.baige.me/api/add/saveLink",
        data: JSON.stringify( clip),
        type: "post"
      })
    );
  })
  }

  if (posts.length > 0) {
    Promise.all(posts).then(function(res) {
      //如果正常返回，即返回新建的clip的id
      // clip.id = res.data.id;
      clips.forEach(function(clip) {
        clip.dirty = false;
        clip.isTemp = false;
      });
      showMessage("保存贴片完成!");
    });
  }
}

function removeClip(e, clipId) {
  var clipId = clipId || selectedClipId;
  unselectClip(true);
  var clip = getClip(clipId);
  if (!clip.isTemp) {
    //删除贴片的接口，根据类型不同，地址不同。只提交了个Id上去
    var url = clip.type == "video" ? "videoClips/delete" : "linkClips/delete";
    // $.ajax({ url: url, data: { id: clipId }, type: "post" }).done(
    // function (res) {
    //如果正常返回，即返回新建的clip的id
    showMessage("删除贴片完成!");
    clips = clips.filter(function(clip) {
      return clip.id != clipId;
    });
    updateClips();
    // }
    // );
  } else {
    clips = clips.filter(function(clip) {
      return clip.id != clipId;
    });
    updateClips();
  }
}

function getClip(id) {
  return clips.find(function(clip) {
    return clip.id == id;
  });
}
function selectClip(clip) {
  if (typeof clip == "string") clip = getClip(clip);
  unselectClip();

  if (!clip) {
    selectedClip = null;
    return;
  }

  $("#addClipTips").hide();
  if (clip.type == "video") $("#videoClip").show();
  else $("#linkClip").show();

  selectedClipId = clip.id;

  var x = clip.x;
  var y = clip.y;
  var width = clip.width;
  var height = clip.height;

  $(`[data-clip-id=${selectedClipId}]`).css({
    left: x + "px",
    top: y + "px",
    width: width + "px",
    height: height + "px",
    transform: ""
  });

  $(`[data-clip-id=${selectedClipId}]`)
    .addClass("selected")
    .freetrans({
      onUpdate: function(bounds, transformInfo) {
        // return {x:true,y:true};
        var po = $(".clip-container").offset();
        var selectClipDom = $(`[data-clip-id=${selectedClipId}]`);
        var pos = $(selectClipDom).offset();
        var orginW = $(selectClipDom).width();
        var orginH = $(selectClipDom).height();

        var nx = pos.left - po.left; //bounds.xmin - po.left;
        var ny = pos.top - po.top; //bounds.ymin - po.top;
        var nw = Math.round(orginW * transformInfo.scalex); //bounds.width;
        var nh = Math.round(orginH * transformInfo.scaley); //bounds.height;

        nx = Math.round(nx / documentZoom);
        ny = Math.round(ny / documentZoom);
        //  console.log(nx,ny,nw,nh,po,pos,transformInfo);
        // nw = Math.round(nw / documentZoom);
        // nh = Math.round(nh / documentZoom);

        // console.log("nx,ny",nx,ny);
        if (nx < 0 || ny < 0 || nx + nw > docWidth || ny + nh > docHeight) {
          return {
            x: !(nx < 0 || nx + nw > docWidth),
            y: !(ny < 0 || ny + nh > docHeight)
          };
        } else 
        {
          clip.x = nx;
          clip.y = ny;
          clip.width = nw;
          clip.height = nh;
          clip.dirty = true;

          $(selectClipDom).find(".action-bt").css(
            "transform",
            `scale(${1 / transformInfo.scalex},${1 / transformInfo.scaley})`
          );
          $(selectClipDom).find(".video-content").css(
            {
              width:orginW*transformInfo.scalex+"px",
              height:orginH*transformInfo.scaley+"px",
              transform:`scale(${1 / transformInfo.scalex},${1 / transformInfo.scaley})`
            }
          );

          
          
          updateClipSizeInfo();
          return { x: true, y: true };
        }
      },
      x: Number(x),
      y: Number(y),
      width: Number(width),
      height: Number(height),
      scalex: 1,
      scaley: 1
    })
    .freetrans("rotator", false);
  if (clip.type == "video") {
    $("[name=videoUrl]").val(clip.url);
    $("#videoUrlTxt").text(clip.url);

    $(`[name=playMode][value=${clip.inline ? 1 : 0}]`).attr("checked", "true");
    $("[name=autoPlay]").attr("checked", clip.autoplay);
    // $("[name=videoTitle]").val(clip.title);
  } else if (clip.type == "link") {
    $("[name=linkUrl]").val(clip.to);
    $(`[name=linkMode][value=${clip.href ? 1 : 0}]`).attr("checked", "true");
    if (clip.href) {
      $(`.normal-link-mode`).show();
      $(`.page-link-mode`).hide();
    } else {
      $(`.normal-link-mode`).hide();
      $(`.page-link-mode`).show();
    }
    // $("[name=linkTitle]").val(clip.title);
  }

  $("[name=boundInfo_left]").val(x);
  $("[name=boundInfo_top]").val(y);
  $("[name=boundInfo_width]").val(width);
  $("[name=boundInfo_height]").val(height);
}

function updateClipSizeInfo() {
  var clip;
  if (selectedClipId) clip = getClip(selectedClipId);
  if (!clip) return;
  var clipDom = $(`[data-clip-id=${clip.id}]`);

  // clip.x = Number(clipDom.css("left").replace("px", ""));
  // clip.y = Number(clipDom.css("top").replace("px", ""));
  // clip.width = Number(clipDom.css("width").replace("px", ""));
  // clip.height = Number(clipDom.css("height").replace("px", ""));

  $("[name=boundInfo_left]").val(clip.x);
  $("[name=boundInfo_top]").val(clip.y);
  $("[name=boundInfo_width]").val(clip.width);
  $("[name=boundInfo_height]").val(clip.height);
}

function handleBoundInfoChange(e) {
  var x = $("[name=boundInfo_left]").val();
  var y = $("[name=boundInfo_top]").val();
  var width = $("[name=boundInfo_width]").val();
  var height = $("[name=boundInfo_height]").val();

  var clip = getClip(selectedClipId);

  x = isNaN(x) ? clip.x : x;
  y = isNaN(y) ? clip.y : y;
  width = isNaN(width) || Number(width) <= 0 ? clip.width : width;
  height = isNaN(height) || Number(height) <= 0 ? clip.height : height;

  $(`[data-clip-id=${selectedClipId}]`).freetrans({
    x: Number(x),
    y: Number(y),
    width: Number(width),
    height: Number(height),
    scalex: 1,
    scaley: 1
  });
}

function syncClip() {
  var clip;
  if (selectedClipId) clip = getClip(selectedClipId);
  if (!clip) return;
  var clipDom = $(`[data-clip-id=${clip.id}]`);

  if (clip.type == "video") {
    clip.url = $("[name=videoUrl]").val();
    clip.inline = $(`[name=playMode]:checked`).val() == "1";
    clip.autoplay = !!$("[name=autoPlay]").attr("checked");
    // clip.title = $("[name=videoTitle]").val();
  } else if (clip.type == "link") {
    clip.to = $("[name=linkUrl]").val();
    clip.href = $(`[name=linkMode]:checked`).val() == "1";
    // clip.title = $("[name=linkTitle]").val();
  }
  clip.dirty = true;
  // clip.x = Number(clipDom.css("left").replace("px", ""));
  // clip.y = Number(clipDom.css("top").replace("px", ""));
  // clip.width = Number(clipDom.css("width").replace("px", ""));
  // clip.height = Number(clipDom.css("height").replace("px", ""));
  // clip.area = (
  //   clipDom.css("left") +
  //   "," +
  //   clipDom.css("top") +
  //   "," +
  //   clipDom.css("width") +
  //   "," +
  //   clipDom.css("height")
  // ).replace(/px/gi, "");
  return clip;
}

function unselectClip(noSave) {
  if (!selectedClipId) return;

  syncClip();

  // if (clip.type == "video") {
  $("[name=videoUrl]").val("");
  // $(`[name=playMode][value=${clip.mode}]`).attr("checked", "true");
  // $("[name=autoPlay]").attr("checked", clip.autoplay);
  // $("[name=videoTitle]").val("");
  // } else if (clip.type == "link") {
  $("[name=linkUrl]").val("");
  // $("[name=linkTitle]").val("");
  // }

  // !noSave && saveClip();





  try{
  $(`[data-clip-id=${selectedClipId}]`)
    .removeClass("selected")
    .freetrans("destroy");
  }catch(err){}

  // var _selectClipId=selectedClipId;
  // requestAnimationFrame(function(){
   
    $(`[data-clip-id=${selectedClipId}] .video-content`).css(
      {
        width:"100%",
        height:"100%",
        transform:`none`
      }
    );
  // })
  

  selectedClipId = null;
  $("#addClipTips").show();
  $("#videoClip").hide();
  $("#linkClip").hide();
}

$(document).on("mousedown", ".flipbook", function() {
  unselectClip();
});

$(document).on(
  "click",
  ".flipbook .clip-container .doc-clip .action-bt",
  function(e) {
    var clip = getClip(
      $(this)
        .parents(".doc-clip")
        .data("clip-id")
    );
    if (!clip) return;
    var clipDom = $(`[data-clip-id=${clip.id}]`);

    //编辑模式
    if (isEditorMode && !previewMode) {
      selectClip(clip);
    }
    //普通模式
    else {
      if (clip.type == "link") {
        if (clip.href) {
          window.open(clip.to);
        } else {
          pageTo(clip.to);
        }
      } else if (clip.type == "video") {
        if (!clip.inline) {
          var videoUrl = `http://player.baige.me/vod?i=${clip.url}&autoplay=${
            clip.autoplay ? "true" : "false"
          }&width=600&height=480`;
          // videoUrl = ""; //"https://baidu.com";
          var videoContent = `<iframe src="${videoUrl}" 
          frameborder="0" scrolling="no" width="600" 
          height="480" allowfullscreen > </iframe>`;

          // `<video   autoplay='${
          //   clip.autoplay ? "autoplay" : "none"
          // }' src='${clip.url}' controls loop/>`;
          $("#videoClipPopup")
            .dialog("open")
            .dialog("option", "width", 600)
            .dialog("option", "height", 480 + 30)
            .empty()
            .append(videoContent);
        } else {
          var videoDom = $(clipDom)
            .find("video")
            .get(0);
          if (videoDom) {
            // if (videoDom.paused)
            //   $(clipDom).find(".play-icon").removeClass("icon-pause").addClass('icon-play');
            // else
            //   $(clipDom).find(".play-icon").removeClass("icon-play").addClass('icon-pause');

            if (!videoDom.paused) {
              $(clipDom)
                .find(".play-icon")
                .removeClass("icon-pause")
                .addClass("icon-play");
              videoDom.pause();
            } else {
              $(clipDom)
                .find(".play-icon")
                .removeClass("icon-play")
                .addClass("icon-pause");
              videoDom.play();
            }

            // if (videoDom.muted) {
            //   $(clipDom)
            //     .find(".mute-icon")
            //     .removeClass("icon-mute")
            //     .addClass("icon-unmute");
            //   videoDom.muted = false;
            // } else {
            //   $(clipDom)
            //     .find(".mute-icon")
            //     .removeClass("icon-unmute")
            //     .addClass("icon-mute");
            //   videoDom.muted = true;
            // }
          }
        }
      }
    }
  }
);

$(document).on("click", ".flipbook .clip-container .doc-clip", function(e) {
  var clip = getClip($(this).data("clip-id"));
  if (!clip) return;
  var clipDom = $(`[data-clip-id=${clip.id}]`);
  selectClip(clip);
});

//预览模式
var previewMode = false;
function togglePreviewMode() {
  // previewMode = !previewMode;
  isEditorMode = !isEditorMode;
  if (!isEditorMode) $(".preview-mode-bt").text("结束预览模式");
  else $(".preview-mode-bt").text("进入预览模式");
  updateClips($(".flipbook").turn("page"));
}

//end of clips

//start of password

function saveSharePwd() {
  //为文档设置访问密码。（并未在界面上体现出来）
  $.ajax({
    url: "docpwd/add",
    data: { id: documentId, password: $("[name=sharePwd]").val() },
    type: "post"
  }).then(function(res) {
    showMessage("密码设置完成!");
  });
}

function removeSharePwd() {
  //为文档清空访问密码。（并未在界面上体现出来）
  $.ajax({
    url: "docpwd/remove",
    data: { id: documentId },
    type: "post"
  }).then(function(res) {
    showMessage("密码移除完成!");
  });
}

function passwordCheck() {
  needPassword = false;
  loadClips();
  return;

  //检测密码的接口
  $.ajax({
    url: "docpwd/check",
    data: { password: $("#passwordInput").val() }
  }).done(function(res) {
    //如果密码正确，就移除掉输入密码的弹窗
    needPassword = false;
    loadClips();
  });
}

//end of password

function showMessage(msg) {
  $("#messageBox")
    .text(msg)
    .show({ effect: "fade" })
    .delay(2000)
    .hide({ effect: "fade" });
}

function isPanAble() {
  var size = $(".flipbook").turn("size");
  var zoom = getZoom();
  return size.width * zoom > windowWidth || size.height * zoom > windowHeight;
}

$(".flipbook-pageinfo-current")
  .on("focusin", function() {
    $(".flipbook-pageinfo-current").val("");
  })
  .on("focusout", function() {
    updatePageInfo();
  });

function handlePageEnter(e) {
  if (e.keyCode == 13) {
    var mp = $(".flipbook").turn("pages");
    var inputPage = $(".flipbook-pageinfo-current")
      .val()
      .split("-");
    var np = Number(inputPage[0]);
    if (!isNaN(np)) {
      np = Math.min(Math.max(1, np), mp);
      $(".flipbook").turn("page", np);
    }
  }
}
function changePageInputChange(e) {}

function updatePageInfo() {
  var p = $(".flipbook").turn("page");
  var mp = $(".flipbook").turn("pages");
  var display = $(".flipbook").turn("display");

  $(".flipbook-pageinfo-current:not(::focus)").val(
    p > 1 && p < mp && display == "double" ? p + "-" + (p + 1) : p
  );
  $(".flipbook-pageinfo-total").text(mp);
  $(".flipbook-pageinfo-current-text").text(p);

  if (p > 1) $(".flipbook-background-page-turner .page-up .iconfont").show();
  else $(".flipbook-background-page-turner .page-up .iconfont").hide();

  if (p < mp) $(".flipbook-background-page-turner .page-down .iconfont").show();
  else $(".flipbook-background-page-turner .page-down .iconfont").hide();
}

function centerFlipbook() {
  var size = $(".flipbook").turn("size");
  $(".flipbook").css({ top: -size.height / 2, left: -size.width / 2 });

  // if (IsPC())
  {
    if (windowWidth < size.width || windowHeight < size.height) {
      $("body").addClass("candrag");
      $(".flipbook").draggable({
        disabled: false,
        containment: [
          Math.min(windowWidth - size.width, (windowWidth - size.width) / 2),
          Math.min(
            windowHeight - size.height,
            (windowHeight - size.height) / 2
          ),
          Math.max(0, (windowWidth - size.width) / 2),
          Math.max(0, (windowHeight - size.height) / 2)
        ]
      });
    } else {
      $("body").removeClass("candrag");
      try {
        $(".flipbook").draggable("disable");
      } catch (er) {}
    }
  }
  // $(".flipbook").removeClass("non-animated")
}

function getZoom() {
  return panzoomer.getTransform().scale;
  // return $(".flipbook").turn("zoom");
}

function zoomFlipbook(zoom, force) {
  zoom = Math.max(1, Math.min(maxZoom, zoom));

  var zoomer = { zoom: getZoom() };

  var pos = {
    x: (window.innerWidth / 2) * (1 - zoom),
    y: (window.innerHeight / 2) * (1 - zoom)
  };

  if (force) {
    var p = panzoomer.getTransform();
    p.x = pos.x;
    p.y = pos.y;
    p.scale = zoom;
    panzoomer.pause();
    panzoomer.resume();
    // $(".flipbook").turn("zoom", zoom);
    //     $(".flipbook").turn("resize");
  } else {
    var p = panzoomer.getTransform();
    anime.remove(p);
    anime({
      targets: [p],
      x: pos.x,
      y: pos.y,
      scale: zoom,
      easing: "easeOutQuad",
      duration: 400,
      update: function() {
        panzoomer.moveTo(p.x, p.y);
      }
    });

    // anime({
    //   targets: zoomer,
    //   zoom: zoom,
    //   duration:400,
    //   easing: 'easeInOutExpo',
    //   update: function() {
    //     // requestAnimationFrame(function(){
    //       $(".flipbook").turn("zoom", zoomer.zoom);
    //       $(".flipbook").turn("resize");
    //     // })
    //   }
    // });
  }

  // $(zoomer).velocity({p:{zoom:zoom},o:{progress:function(){
  //   console.log(arguments);
  //   // requestAnimationFrame(function(){
  //     // $(".flipbook").turn("zoom", fx.now);
  //   // })
  // }}})
}

function zoomReset() {
  zoomFlipbook(1);

  hideZoomPanel();
}
var isMaxZoom = false;
function zoomToggle() {
  if (isMaxZoom) {
    zoomFlipbook(1);
    isMaxZoom = false;
  } else {
    zoomFlipbook(maxZoom);
    isMaxZoom = true;
  }
  return isMaxZoom;
}

function zoomin() {
  //$('.flipbook-viewport').zoom("magnify");

  var zoom = getZoom() + 0.2;
  zoomFlipbook(zoom);
}

function zoomout() {
  var zoom = getZoom() - 0.2;
  zoomFlipbook(zoom);
}

function pageFirst(e) {
  zoomReset();
  $(".flipbook").turn("page", 1);
  updatePageInfo();
  e.stopImmediatePropagation();
}

function pageUp() {
  zoomReset();
  var p = $(".flipbook").turn("page");
  var mp = $(".flipbook").turn("pages");
  if (p <= 1) {
    showPageEndTips("first");
  } else {
    $(".flipbook").turn("previous");
    updatePageInfo();
  }
}

function pageDown() {
  zoomReset();

  var p = $(".flipbook").turn("page");
  var mp = $(".flipbook").turn("pages");
  if (p >= mp) {
    showPageEndTips("last");
  } else {
    $(".flipbook").turn("next");
    updatePageInfo();
  }
}

function pageLast(e) {
  zoomReset();
  $(".flipbook").turn("page", $(".flipbook").turn("pages"));
  updatePageInfo();
  e.stopImmediatePropagation();
}

function pageTo(page) {
  zoomReset();
  page = Math.max(1, Math.min(pages, page));

  $(".flipbook").turn("page", page);
  updatePageInfo();
}

function showPageEndTips(tip) {
  $(".pageEndTips")
    .text(tip == "first" ? "这是第一页" : "这是最后一页")
    .show("fade", 500)
    .delay(2000)
    .hide("fade");
}

function loadPage(page, book) {
  //加载具体的页的html文件内容
  // $.ajax({ url: "pages/page" + page + ".html" }).done(function(pageHtml) {
  $.ajax({ url: 'https://book-upload-1251142715.cos.ap-shanghai.myqcloud.com/113425e3-35fc-4ebc-a399-927d32683391/BMW%2BZ4%E8%B7%91%E8%BD%A6-'+page+'.svg' ,dataType:"text"}).done(function(pageHtml) {
    $(".flipbook .page.p" + page)
      .html(
        '<div class="gradient"></div><div class="page-bg"></div>' +
          pageHtml +
          '<div class="clip-container"></div>'
      )
      .addClass("page-container");
    updateClips(page);
    rescalePages();
  });
}

function addPage(page, book) {
  var id,
    pages = book.turn("pages");

  // Create a new element for this page
  var className = "";
  if (page == 0) {
    className = "first";
  } else if (page == book.turn("pages")) {
    className = "last";
  }

  var element = $("<div />").addClass(className); //, {class:className});

  // console.log('addpage',page)
  // if (!$(".flipbook").turn("hasPage", page)) {
  // if($('.flipbook .p' + page).length==0){
  // Add the page to the flipbook
  if (book.turn("addPage", element, page)) {
    // Add the initial HTML
    // It will contain a loader indicator and a gradient
    // console.log('pageCaches[page]',pageCaches[page],)
    element.html(
      '<div class="gradient"></div><div class="page-bg"></div><div class="loader-info">加载中...</div>'
    );

    // Load the page
    //页的加载是通过pdf2htmlEX去加载完成后再同步过来的。并不需要flipjs去加载
    loadPage(page, element);
  }
  // }
}
var bookWidth = 0;
var bookHeight = 0;
var bookViewWidth = 0;
var bookViewHeight = 0;
function rescalePages() {
  var displayModeAdjust = $(".flipbook").turn("display") == "single" ? 1 : 2;

  bookWidth = $(".flipbook").turn("size").width / displayModeAdjust;
  bookHeight = $(".flipbook").turn("size").height;


  var views=$(".flipbook").turn("view").filter(function(i){return Number(i)!=0})

  bookViewWidth = $(".flipbook").turn("size").width/displayModeAdjust*views.length;
  bookViewHeight = $(".flipbook").turn("size").height;

  documentZoom = Math.min(bookWidth / docWidth, bookHeight / docHeight);
  $(".flipbook .page>*").css({
    position: "absolute",
    width: docWidth + "px",
    height: docHeight + "px",
    msTransform: "scale(" + documentZoom + ")",
    transform: "scale(" + documentZoom + ")",
    transformOrigin: "0 0",
    msTransformOrigin: "0 0"
  });
  if (panzoomer) {
    panzoomer.setOptions("contentBBox", {
      left: 0,
      top: 0,
      right: bookViewWidth,
      bottom: bookViewHeight,
      width: bookViewWidth,
      height: bookViewHeight
    });
    panzoomer.setOptions("boundsOffset", {
      x: (windowWidth - bookViewWidth) / 2,
      y: (windowHeight - bookViewHeight) / 2
    });
  }
}
function resizeViewport() {
  var nw = 0;
  var nh = 0;
  var s = 1;

  var displayModeAdjust = $(".flipbook").turn("display") == "single" ? 1 : 2;

  if (
    ((windowWidth - padding) / docWidth) * displayModeAdjust <
    windowHeight - paddingV / docHeight
  ) {
    nw = windowWidth - padding;
    nh = (((windowWidth - padding) / displayModeAdjust) * docHeight) / docWidth;

    if (nh > windowHeight - paddingV) {
      s = (windowHeight - paddingV) / nh;
      nw *= s;
      nh *= s;
    }

    // s=Math.min(1,nh/(windowHeight-padding));
    // nw*=s;
    // nh*=s;
  } else {
    nw = ((windowHeight - paddingV) * docWidth) / docHeight;
    nh = windowHeight - paddingV;
    if (nw > (windowWidth - padding) / displayModeAdjust) {
      s = (windowWidth - padding) / displayModeAdjust / nw;
      nw *= s;
      nh *= s;
    }
    // s=Math.min(1,nw/((windowWidth-padding)/2));
    // nw*=s;
    // nh*=s;
  }

  $(".flipbook").turn("size", nw, nh);

  $(".flipbook").css({ top: -nh / 2, left: -nw / 2 });

  rescalePages();
  $(".flipbook").turn("resize");

  $("html")
    .get(0)
    .style.setProperty("--zoom", getZoom() * documentZoom);

  centerFlipbook();
}
var windowWidth =
  window.innerWidth ||
  Math.max(document.documentElement.clientWidth, document.body.clientWidth);
var windowHeight =
  window.innerHeight ||
  Math.max(document.documentElement.clientHeight, document.body.clientHeight);

// Load the HTML4 version if there's not CSS transform

if (Modernizr.csstransforms) {
} else {
  setOldBrowser();
}

var maxZoom = 2.5;
//当前的文档的放缩值
var documentZoom = 1;

yepnope({
  test: Modernizr.csstransforms,
  yep: ["./lib/turn.js"],
  nope: ["./lib/turn.html4.min.js"],
  both: [
    "./css/basic.css",
    "./lib/hash.js",
    "./lib/browser-polyfill.js",
    "./lib/panzoom.js",
    "./lib/hammer.min.js",
    "./lib/anime.min.js"
  ],
  complete: loadClips
});
