
    function handleActionChange(id) {
      console.log(id);
      if (id == 'addClipsPanel') {
        $(".clip-tabs").tabs("option", "active", 0)
        handleClipTypeChange('video');
      } else if (id == 'sharePanel') {
        $(".clip-tabs").tabs("option", "active", 1)
      } else if (id == 'embedPanel') {
        $(".clip-tabs").tabs("option", "active", 2)
      }
    }

    function handleClipTypeChange(type) {
      console.log(type);
    }

    function setfbTopBarMoreMargin() {
      var obj = $("#fbTopBar");
      var width = $(document).width();
      var objWidth = obj.width();
      var left = objWidth + parseInt((width - objWidth) / 2) - 30;

      $("#fbTopBarMore").css("left", left);
    }



    function preview() {
      $("#maindiv").hide();
      $("#preview").show();
    }

    function maindivShow() {
      $("#maindiv").show();
      $("#preview").hide();
    }


    function sharePage() {
      $("#shareQrCode").show();
    }
    function goBookshelf() {
      window.location.href = "/page/bookshelf.html";
    }
    function getImgList(bookId, currentPage, pageSize, callback) {
      $.ajax({
        type: "POST",
        url: "/book/getImgList",
        data: {
          bookId: bookId,
          currentPage: currentPage,
          pageSize: pageSize,
        },
        async: false,
        success: function (data) {
          pageResult = data;
          if (callback) {
            callback(data);
          } else {
            dealResult(data);
          }
        },
        dataType: "json",
      });
    }

    function dealResult(data) {
      var books = data.result;
      var imgHtml = "";
      var pageSelectHtml = "";
      var previewHtml = "";
      for (var i = 0; i < books.length; i++) {
        var imageBean = books[i];
        var pageNo = i + 1;
        //处理CSS
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href =
          "https://baige-1251142715.file.myqcloud.com/113425e3-35fc-4ebc-a399-927d32683391/1.css";
        document.getElementsByTagName("head")[0].appendChild(link);

        //处理页面DIV

        $.ajax({
          type: "get",
          url:
            "https://	baige-1251142715.file.myqcloud.com/113425e3-35fc-4ebc-a399-927d32683391/1.html",
          timeout: 30000,
          /* pageNo==1?"false":"true", */
          success: function (resp) {
            //var dom='<div id="page-container" style="position: relative; background: #555;"><div class="pf-border" page="1"><div class="pf w0 h0" data-page-no="1" id="pf1"><div class="pc pc1 w0 h0"><img class="bi x0 y0 w1 h1" alt="" src="http://baige-1251142715.image.myqcloud.com/113425e3-35fc-4ebc-a399-927d32683391/bg1.jpg"><div class="t m0 x1 h2 y1 ff1 fs0 fc0 sc0 ls0 ws0">Sheer<span class="_ _0"></span>  </div><div class="t m0 x2 h2 y2 ff1 fs0 fc0 sc0 ls0 ws0">Driving Pleasure</div><div class="t m0 x3 h3 y3 ff2 fs1 fc1 sc0 ls0 ws0">获取<span class="ff3">最新</span>电子版</div></div><div class="pi" data-data="{&quot;ctm&quot;:[1.646295,0.000000,0.000000,1.646295,0.000000,0.000000]}"></div></div></div></div>';
            //imgHtml += dom;
          },
        });

        pageSelectHtml +=
          "<option value='" + pageNo + "'>" + pageNo + "</option>";
        pages = books.length;
        previewHtml +=
          "<div class='previewDiv'><img pageNo='" +
          pageNo +
          "' onclick='goToPageNum(" +
          pageNo +
          ");return false;' data-original=\"" +
          imageBean.imgPath +
          "\" class='previewImg' src=\"" +
          imageBean.imgPath +
          '"><span>' +
          pageNo +
          "</span></div>";
      }
      totalCount = data.totalCount;
      $(".flipbook").html(imgHtml);
      $("#pageSelect").html(pageSelectHtml);
      $("#preview").html(previewHtml);
    }


    function getBookId() {
      var uri = window.location.pathname;
      return uri.substring(uri.indexOf("_") + 1, uri.indexOf("."));
    }

/////////LINK CLIP//////////


    function changeLinkMode(e)
{
  
  $(".normal-link-mode").hide();
  $(".page-link-mode").hide();
  if(e.target.value=="1"){
    $(".normal-link-mode").show();
  }else{
    $(".page-link-mode").show();
  }
  
}


    
//start of embed

function handleSettingIconSwitch(e)
{
  if($("#embedCodePopup [name=setting-icon-switch]").attr("checked"))
  {
    $(".embedCode-tabs").show({effect:"size", to:{height:"auto"}})
  }else{
    $(".embedCode-tabs").hide({effect:"size", to:{height:0}})
  }
}



var embedType='interactive';
var embedOpenType='popup';

function handleEmbedCodeTabChange(id)
{
  // var content="";
  if (id == 'interactiveMode') {
    embedType='interactive';
  //   var url=new URL(docUrl);
  //   if(url.search)
  //     url.search+="&lite";
  //   else
  //     url.search="?lite";

  //   content=`<iframe src='${url.href}' style="width:100%;height:100%;" frameborder=0 seamless="seamless"  ></iframe>`
  }else{
    embedType="cover";
  //   content=`<img src='${docCover}' style="object-fit: contain;width:100%;height:100%;" frameborder=0 seamless="seamless" />`
  }

  // $(".preview_content").empty().append(content);
  updateEmbedCode();
 
}


function showEmbedCodePop() {
  $("#embedCodePopup").dialog({
    modal: true,
    autoOpen: true,
    title: "嵌套代码",
    width: 480,
    // height: 360,
    resize: false,
    position: { my: "center", at: "center center-100", of: "#maindiv" },
  });
}
function updateEmbedCode() {
  
  embedOpenType=$("[name=coverMode]:checked").val();

  var embedWidth=$(".size_info_w").val();
  var embedHeight=$(".size_info_h").val();

  embedWidth=isNaN(embedWidth)||Number(embedWidth)<10?600:Number(embedWidth);
  embedHeight=isNaN(embedHeight)||Number(embedHeight)<10?600:Number(embedHeight);


  var embedCode ="";
  var titleContent ="";
  if(embedType=='interactive')
  {
    embedCode = `<iframe src='${docUrl}' style="width:${embedWidth}px;height:${embedHeight}px;" frameborder=0 seamless="seamless"  ></iframe>`;
  }else{
    var titleContent = `<img style="width: 100%;" src='${docCover}' style="height: 100%;width: 100%;object-fit: contain;" /><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);max-width:min(20%,80px);padding:10px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.8)"><img src='https://u9zw2.csb.app/book.png' /></div>`
    if(embedOpenType=="popup")
    {
      var popid = "pop_" + Math.round(Math.random() * 100000);
      embedCode = `<a href="#" style="width:100%;height:100%;position: relative;display:block"  onclick="document.querySelector('#${popid}').style.display='block'" title="打开百鸽文档-${docTitle}">${titleContent}</a>
  <div id="${popid}" style="display: none;
  position: fixed;
  width: 100%;
  height: 100%;
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
  top: 0;
  left: 0;
  z-index: 99999;
  ">
  <a href="#" title="关闭" onclick="document.querySelector('#${popid}').style.display='none'" style="top:0;right:0;position:absolute;width:32px;height:32px;"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABCklEQVRYR+2WPQ8BQRRFz/5IGgoaGgoaGgoaGgoaGgoa/qS8ZCd5JnY+NpJHslvuzNx37t2ZN1tg/BTG9WkAmgRSEmgBz5qbNbo2BiACD6AL3DMhOsANaIcMhABccVe3D1wTIXrARc2thIgl4Fw4rSFwjkAMgJOaE0wvBiA6vpsxcKyAGAEHNRZNLQVA9HxXU2DvQUyAnXqXklZWJ/TdzYFtWXAGbFTxUEpv3KkJuEW+y2U5sFKqn9Kp3Da5ACLku9XiOpWkA1MHQIQXgHYt7ySNdVJVNekvAUw/gekmND2Gpo3ItBWbXkY/cR2b/pC4fhX9rQp0v+jaup0wt+N+9TL6WnERahJoEngBVwxCId2AjWYAAAAASUVORK5CYII=" /></a>
  <iframe src='${docUrl}' style="width:100%;height:100%;" frameborder=0 seamless="seamless"  ></iframe>
  </div>`;
    }else{
      embedCode=`<a href='${docUrl}' target='_blank' style="width:100%;height:100%;position: relative;display:block" >${titleContent}</a>`;
    }
  }
  
  $("[name=embedCode]").val(embedCode);
  $(".preview_content").empty().append($("[name=embedCode]").val());
}

function copyEmbedCode() {
  var textarea = $("[name=embedCode]").get(0);
  textarea.focus();
  textarea.select();
  try {
    var flag = document.execCommand("copy"); //执行复制
  } catch (eo) {
    var flag = false;
  }
  showMessage("复制完成!");
}
$(`[name=embedButtonStyle]`).on("change", updateEmbedCode);
$(`[name=coverMode]`).on("change", updateEmbedCode);
$(`input.size_info`).on('input', updateEmbedCode);





$("#passwordPopup img").attr("src",docCover)

$(function () {
  $("body").addClass(IsPC() ? "notmobile" : "mobile")


  $(".embedCode-tabs").tabs({
    activate: function( event, ui ) {
      handleEmbedCodeTabChange($(ui.newPanel).attr('id'))
    }
  });

  handleEmbedCodeTabChange("interactiveMode");

  updateEmbedCode();



  initUpload();
})

function startUploadFile()
{
  $("#fileupload").click();
}

var jqXHR;
var processData;
function initUpload()
{

 //文档上传相关
 $("#fileupload").fileupload({
   url:"//jquery-file-upload.appspot.com/",
dataType: "json",
maxFileSize:50000000, 
minFileSize:10000,
acceptFileTypes: /\.pdf$/,
    singleFileUploads: false,
    processalways: function (e, data) {
      processData = data;
    },
    processstop: function (e) {
    console.log(e);
},
messages: {
    maxNumberOfFiles: '超过最大上传文件数',
    acceptFileTypes: '仅支持pdf格式的文件',
    maxFileSize: '文件太大了（只能传50MB以内的文档）',
    minFileSize: '文件太小了（文件至少要10kb）'
  },
add: function(e, data) {   
var $this = $(this);
data.context =$("#uploadPopup .content");

// $("#uploadPopup").empty().append(`<p class="title">${data.files[0].name}</p><div class="upload_row"><p class="file"></p><span class="progress_val">0%</span></div><p class="info">上传中...</p><button class="cancel_bt">取消</button><button class="ok_bt" style="display:none">确定</button>`);

$("#uploadPopup .content").find(".file").removeClass("done");
data.context.find(".file").css("background-position-x",  "100%");
data.context.find(".progress_val").text("0%")

$("#uploadPopup .content").find(".cancel_bt").click(function(){
  if(jqXHR)
  try{jqXHR.abort();}catch(e){}
  $("#uploadPopup").dialog('destroy').hide();
});
$("#uploadPopup .content").find(".ok_bt").click(function(){
  $("#uploadPopup").dialog('destroy').hide();
})
$("#uploadPopup").dialog({classes:{
  "ui-dialog": "ui-corner-all",
  "ui-dialog-titlebar": "ui-corner-all noclosePopup",
},
  closeOnEscape: false,
  modal: true,
  autoOpen: true,
  title: "上传PDF",
  width: 320,
  resize: false,
  position: { my: "center", at: "center center-100", of: "body" },
});

data.process(function () {
        return $this.fileupload('process', data);
      }).done(function(){

        if(jqXHR)
  try{jqXHR.abort();}catch(e){}
jqXHR =  data.submit();

      }) .fail(function () {
        if (data.files.error) {
          data.context.each(function (index) {
            var error = data.files[index].error;
            if (error) {
              $(this).find('.info').text(error);
              $(this).find('.upload_row').hide();
            }
          });
        }
      });


},

progress: function(e, data) {
var progress = parseInt((data.loaded / data.total) * 100, 10);
data.context.find(".file").css("background-position-x", 100 - progress + "%");
data.context.find(".progress_val").text(progress + "%")
},
done: function(e, data) {
data.context.find(".file")
  .addClass("done");
  data.context.find(".info").text("上传完成");
  data.context.find(".cancel_bt").hide();
  data.context.find(".ok_bt").show();
  // .find("a")
  // .prop("href", data.result.files[0].url);
}
});

}