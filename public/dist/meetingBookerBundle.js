$(document).ready(function(){

    $('.ui.form')
      .form({
          title: {
              identifier  : 'title',
              rules: [
                  {
                      type   : 'empty',
                      prompt : 'Please enter a meeting name'
                  }
              ]
          },
          date: {
              identifier  : 'date',
              rules: [
                  {
                      type   : 'empty',
                      prompt : 'Please pick a date'
                  }
              ]
          },
          startTimeClient: {
              identifier : 'startTimeClient',
              rules: [
                  {
                      type   : 'empty',
                      prompt : 'Please pick a start time'
                  }
              ]
          },
          endTimeClient: {
              identifier : 'endTimeClient',
              rules: [
                  {
                      type   : 'empty',
                      prompt : 'Please pick an end time'
                  }
              ]
          },
          location: {
              identifier : 'location',
              rules: [
                  {
                      type   : 'empty',
                      prompt : 'Please pick a location'
                  }
              ]
          },
          category: {
              identifier : 'category',
              rules: [
                  {
                      type   : 'empty',
                      prompt : 'Please pick a category'
                  }
              ]
          }
      });

    $('.ui.divider').hide();
    $('.ui.divider').show();
    $('.ui.divider').animate({width: "100%"}, 2000);

});
var MeetingBooker = new Marionette.Application();
var meetingChannel = Backbone.Radio.channel('meeting');

MeetingBooker.addRegions({
  mainRegion: "#wrapper",
  meetingRegion: '#meeting-region',
  editRegion: '#edit-region'
});

MeetingBooker.navigate = function(route, options) {
  options || (options = {});
  Backbone.history.navigate(route, options);
};

MeetingBooker.on('start', function() {
  // Once all initializers have been run, the 'start' event is triggered. We can only start Backbone's routing (via the history attribute) once all initializer have been run, to ensure the the routing controllers are ready to respond to routing events.
  if(Backbone.history){
    Backbone.history.start();
  }

  // Create new meeting view
  var BlankMeetingForm = Marionette.ItemView.extend({
    template: "#meeting-create",
    events: {
      'submit form': 'saveMeeting'
    },

    saveMeeting: function(e){
      var $form = $('.ui.form');
      e.preventDefault();
      //Get value from an input field
      function getFieldValue(fieldId) {
        // 'get field' is part of Semantics form behavior API
        return $form.form('get field', fieldId).val();
      }

      var formData = {};
      formData.title = getFieldValue('title');
      formData.dateClient = getFieldValue('date');
      formData.date = getFieldValue('date_submit');
      formData.startTimeClient = getFieldValue('startTimeClient');
      formData.startTime = getFieldValue('startTimeClient_submit');
      formData.endTimeClient = getFieldValue('endTimeClient');
      formData.endTime = getFieldValue('endTimeClient_submit');
      formData.location = getFieldValue('location');
      formData.category = getFieldValue('category');

      var meeting = new MeetingBooker.Entities.Meeting(formData);

      $.when(meeting.save())
        .done(function() {
          $form.trigger('reset');
          $('.ui.dropdown').dropdown('restore defaults');
          $('.location').removeClass('mid-gray');
          $('.category').removeClass('mid-gray');

          meetingChannel.command('list:meetings');
         })
        .fail(function(){
          console.log('Meeting is NOT created!')
        });
    },

    onShow: function(){
      $('.js-location-dropdown').dropdown('setting', 'onChange', function(){
        $('.location').addClass('mid-gray');
      });
      $('.js-category-dropdown').dropdown('setting', 'onChange', function(){
        $('.category').addClass('mid-gray');
      });
      $('.datepicker').pickadate({
        format: 'mmm dd, yyyy',
        formatSubmit: 'mm/dd/yyyy',
        min: true
      });
      $('.starttimepicker').pickatime({
        format: 'h:i A',
        formatSubmit: 'HH:i'
      });
      $('.endtimepicker').pickatime({
        format: 'h:i A',
        formatSubmit: 'HH:i'
      });
    }
  });

  var blankMeetingForm = new BlankMeetingForm();
  MeetingBooker.getRegion('mainRegion').show(blankMeetingForm);
});
MeetingBooker.module('CommonViews', function(CommonViews, MeetingBooker, Backbone, Marionette, $, _){
  CommonViews.Loading = Marionette.ItemView.extend({
    template: '#loading-view',
    className: 'ui modal',
    initialize: function(options){
      var options = options || {};
      return this.title = options.title || 'Loading Meeting';
    },
    serializeData: function(){
      return {
        title: this.title
      }
    }
  });
});
// Entities = the module itself, MeetingBooker = the app obj that module was called from
MeetingBooker.module('Entities', function(Entities, MeetingBooker, Backbone, Marionette, $, _){
  var meetingChannel = Backbone.Radio.channel('meeting');
  var storage = new Backbone.LocalStorage('meetings');

  // Model "Class"
  Entities.Meeting = Backbone.Model.extend({
    urlRoot: 'meetings',
    localStorage: storage
  });

  // Collection "Class"
  Entities.Meetings = Backbone.Collection.extend({
    url: 'meetings',
    model: Entities.Meeting,
    comparator: function(meeting) {
      return meeting.get('date') + meeting.get('startTime');
    },
    localStorage: storage
  });

  var API = Marionette.Object.extend({
    getMeetings: function () {
      var meetings = new Entities.Meetings();
      var defer = $.Deferred();
      meetings.fetch({
        success: function (data) {
          defer.resolve(data);
        }
      });
      return defer.promise();
    },
    getMeeting: function (meetingId) {
      var meeting = new Entities.Meeting({id: meetingId});
      var defer = $.Deferred(); // Declare a Deferred obj instance (something that will happen later)
      meeting.fetch({
        success: function(data){
          defer.resolve(data); // When fetch call succeeds, we resolve the deferred obj & forward the received data
        },
        error: function(data){
          defer.resolve(undefined);
        }
      });
      return defer.promise(); // Return a promise on that obj. Allows code elsewhere to monitor the promise and react to any changes (fresh data coming in)
    }
  });

  var api = new API();

  /* Handler for meeting collection requests. */
  meetingChannel.reply('meetings', function(){
    return api.getMeetings();
  });

  /* Handler for individual meeting requests. */
  meetingChannel.reply('meeting', function(id){
    return api.getMeeting(id);
  });
});

(function($){$.extend({tablesorter:new
function(){var parsers=[],widgets=[];this.defaults={cssHeader:"header",cssAsc:"headerSortUp",cssDesc:"headerSortDown",cssChildRow:"expand-child",sortInitialOrder:"asc",sortMultiSortKey:"shiftKey",sortForce:null,sortAppend:null,sortLocaleCompare:true,textExtraction:"simple",parsers:{},widgets:[],widgetZebra:{css:["even","odd"]},headers:{},widthFixed:false,cancelSelection:true,sortList:[],headerList:[],dateFormat:"us",decimal:'/\.|\,/g',onRenderHeader:null,selectorHeaders:'thead th',debug:false};function benchmark(s,d){log(s+","+(new Date().getTime()-d.getTime())+"ms");}this.benchmark=benchmark;function log(s){if(typeof console!="undefined"&&typeof console.debug!="undefined"){console.log(s);}else{alert(s);}}function buildParserCache(table,$headers){if(table.config.debug){var parsersDebug="";}if(table.tBodies.length==0)return;var rows=table.tBodies[0].rows;if(rows[0]){var list=[],cells=rows[0].cells,l=cells.length;for(var i=0;i<l;i++){var p=false;if($.metadata&&($($headers[i]).metadata()&&$($headers[i]).metadata().sorter)){p=getParserById($($headers[i]).metadata().sorter);}else if((table.config.headers[i]&&table.config.headers[i].sorter)){p=getParserById(table.config.headers[i].sorter);}if(!p){p=detectParserForColumn(table,rows,-1,i);}if(table.config.debug){parsersDebug+="column:"+i+" parser:"+p.id+"\n";}list.push(p);}}if(table.config.debug){log(parsersDebug);}return list;};function detectParserForColumn(table,rows,rowIndex,cellIndex){var l=parsers.length,node=false,nodeValue=false,keepLooking=true;while(nodeValue==''&&keepLooking){rowIndex++;if(rows[rowIndex]){node=getNodeFromRowAndCellIndex(rows,rowIndex,cellIndex);nodeValue=trimAndGetNodeText(table.config,node);if(table.config.debug){log('Checking if value was empty on row:'+rowIndex);}}else{keepLooking=false;}}for(var i=1;i<l;i++){if(parsers[i].is(nodeValue,table,node)){return parsers[i];}}return parsers[0];}function getNodeFromRowAndCellIndex(rows,rowIndex,cellIndex){return rows[rowIndex].cells[cellIndex];}function trimAndGetNodeText(config,node){return $.trim(getElementText(config,node));}function getParserById(name){var l=parsers.length;for(var i=0;i<l;i++){if(parsers[i].id.toLowerCase()==name.toLowerCase()){return parsers[i];}}return false;}function buildCache(table){if(table.config.debug){var cacheTime=new Date();}var totalRows=(table.tBodies[0]&&table.tBodies[0].rows.length)||0,totalCells=(table.tBodies[0].rows[0]&&table.tBodies[0].rows[0].cells.length)||0,parsers=table.config.parsers,cache={row:[],normalized:[]};for(var i=0;i<totalRows;++i){var c=$(table.tBodies[0].rows[i]),cols=[];if(c.hasClass(table.config.cssChildRow)){cache.row[cache.row.length-1]=cache.row[cache.row.length-1].add(c);continue;}cache.row.push(c);for(var j=0;j<totalCells;++j){cols.push(parsers[j].format(getElementText(table.config,c[0].cells[j]),table,c[0].cells[j]));}cols.push(cache.normalized.length);cache.normalized.push(cols);cols=null;};if(table.config.debug){benchmark("Building cache for "+totalRows+" rows:",cacheTime);}return cache;};function getElementText(config,node){var text="";if(!node)return"";if(!config.supportsTextContent)config.supportsTextContent=node.textContent||false;if(config.textExtraction=="simple"){if(config.supportsTextContent){text=node.textContent;}else{if(node.childNodes[0]&&node.childNodes[0].hasChildNodes()){text=node.childNodes[0].innerHTML;}else{text=node.innerHTML;}}}else{if(typeof(config.textExtraction)=="function"){text=config.textExtraction(node);}else{text=$(node).text();}}return text;}function appendToTable(table,cache){if(table.config.debug){var appendTime=new Date()}var c=cache,r=c.row,n=c.normalized,totalRows=n.length,checkCell=(n[0].length-1),tableBody=$(table.tBodies[0]),rows=[];for(var i=0;i<totalRows;i++){var pos=n[i][checkCell];rows.push(r[pos]);if(!table.config.appender){var l=r[pos].length;for(var j=0;j<l;j++){tableBody[0].appendChild(r[pos][j]);}}}if(table.config.appender){table.config.appender(table,rows);}rows=null;if(table.config.debug){benchmark("Rebuilt table:",appendTime);}applyWidget(table);setTimeout(function(){$(table).trigger("sortEnd");},0);};function buildHeaders(table){if(table.config.debug){var time=new Date();}var meta=($.metadata)?true:false;var header_index=computeTableHeaderCellIndexes(table);$tableHeaders=$(table.config.selectorHeaders,table).each(function(index){this.column=header_index[this.parentNode.rowIndex+"-"+this.cellIndex];this.order=formatSortingOrder(table.config.sortInitialOrder);this.count=this.order;if(checkHeaderMetadata(this)||checkHeaderOptions(table,index))this.sortDisabled=true;if(checkHeaderOptionsSortingLocked(table,index))this.order=this.lockedOrder=checkHeaderOptionsSortingLocked(table,index);if(!this.sortDisabled){var $th=$(this).addClass(table.config.cssHeader);if(table.config.onRenderHeader)table.config.onRenderHeader.apply($th);}table.config.headerList[index]=this;});if(table.config.debug){benchmark("Built headers:",time);log($tableHeaders);}return $tableHeaders;};function computeTableHeaderCellIndexes(t){var matrix=[];var lookup={};var thead=t.getElementsByTagName('THEAD')[0];var trs=thead.getElementsByTagName('TR');for(var i=0;i<trs.length;i++){var cells=trs[i].cells;for(var j=0;j<cells.length;j++){var c=cells[j];var rowIndex=c.parentNode.rowIndex;var cellId=rowIndex+"-"+c.cellIndex;var rowSpan=c.rowSpan||1;var colSpan=c.colSpan||1
var firstAvailCol;if(typeof(matrix[rowIndex])=="undefined"){matrix[rowIndex]=[];}for(var k=0;k<matrix[rowIndex].length+1;k++){if(typeof(matrix[rowIndex][k])=="undefined"){firstAvailCol=k;break;}}lookup[cellId]=firstAvailCol;for(var k=rowIndex;k<rowIndex+rowSpan;k++){if(typeof(matrix[k])=="undefined"){matrix[k]=[];}var matrixrow=matrix[k];for(var l=firstAvailCol;l<firstAvailCol+colSpan;l++){matrixrow[l]="x";}}}}return lookup;}function checkCellColSpan(table,rows,row){var arr=[],r=table.tHead.rows,c=r[row].cells;for(var i=0;i<c.length;i++){var cell=c[i];if(cell.colSpan>1){arr=arr.concat(checkCellColSpan(table,headerArr,row++));}else{if(table.tHead.length==1||(cell.rowSpan>1||!r[row+1])){arr.push(cell);}}}return arr;};function checkHeaderMetadata(cell){if(($.metadata)&&($(cell).metadata().sorter===false)){return true;};return false;}function checkHeaderOptions(table,i){if((table.config.headers[i])&&(table.config.headers[i].sorter===false)){return true;};return false;}function checkHeaderOptionsSortingLocked(table,i){if((table.config.headers[i])&&(table.config.headers[i].lockedOrder))return table.config.headers[i].lockedOrder;return false;}function applyWidget(table){var c=table.config.widgets;var l=c.length;for(var i=0;i<l;i++){getWidgetById(c[i]).format(table);}}function getWidgetById(name){var l=widgets.length;for(var i=0;i<l;i++){if(widgets[i].id.toLowerCase()==name.toLowerCase()){return widgets[i];}}};function formatSortingOrder(v){if(typeof(v)!="Number"){return(v.toLowerCase()=="desc")?1:0;}else{return(v==1)?1:0;}}function isValueInArray(v,a){var l=a.length;for(var i=0;i<l;i++){if(a[i][0]==v){return true;}}return false;}function setHeadersCss(table,$headers,list,css){$headers.removeClass(css[0]).removeClass(css[1]);var h=[];$headers.each(function(offset){if(!this.sortDisabled){h[this.column]=$(this);}});var l=list.length;for(var i=0;i<l;i++){h[list[i][0]].addClass(css[list[i][1]]);}}function fixColumnWidth(table,$headers){var c=table.config;if(c.widthFixed){var colgroup=$('<colgroup>');$("tr:first td",table.tBodies[0]).each(function(){colgroup.append($('<col>').css('width',$(this).width()));});$(table).prepend(colgroup);};}function updateHeaderSortCount(table,sortList){var c=table.config,l=sortList.length;for(var i=0;i<l;i++){var s=sortList[i],o=c.headerList[s[0]];o.count=s[1];o.count++;}}function multisort(table,sortList,cache){if(table.config.debug){var sortTime=new Date();}var dynamicExp="var sortWrapper = function(a,b) {",l=sortList.length;for(var i=0;i<l;i++){var c=sortList[i][0];var order=sortList[i][1];var s=(table.config.parsers[c].type=="text")?((order==0)?makeSortFunction("text","asc",c):makeSortFunction("text","desc",c)):((order==0)?makeSortFunction("numeric","asc",c):makeSortFunction("numeric","desc",c));var e="e"+i;dynamicExp+="var "+e+" = "+s;dynamicExp+="if("+e+") { return "+e+"; } ";dynamicExp+="else { ";}var orgOrderCol=cache.normalized[0].length-1;dynamicExp+="return a["+orgOrderCol+"]-b["+orgOrderCol+"];";for(var i=0;i<l;i++){dynamicExp+="}; ";}dynamicExp+="return 0; ";dynamicExp+="}; ";if(table.config.debug){benchmark("Evaling expression:"+dynamicExp,new Date());}eval(dynamicExp);cache.normalized.sort(sortWrapper);if(table.config.debug){benchmark("Sorting on "+sortList.toString()+" and dir "+order+" time:",sortTime);}return cache;};function makeSortFunction(type,direction,index){var a="a["+index+"]",b="b["+index+"]";if(type=='text'&&direction=='asc'){return"("+a+" == "+b+" ? 0 : ("+a+" === null ? Number.POSITIVE_INFINITY : ("+b+" === null ? Number.NEGATIVE_INFINITY : ("+a+" < "+b+") ? -1 : 1 )));";}else if(type=='text'&&direction=='desc'){return"("+a+" == "+b+" ? 0 : ("+a+" === null ? Number.POSITIVE_INFINITY : ("+b+" === null ? Number.NEGATIVE_INFINITY : ("+b+" < "+a+") ? -1 : 1 )));";}else if(type=='numeric'&&direction=='asc'){return"("+a+" === null && "+b+" === null) ? 0 :("+a+" === null ? Number.POSITIVE_INFINITY : ("+b+" === null ? Number.NEGATIVE_INFINITY : "+a+" - "+b+"));";}else if(type=='numeric'&&direction=='desc'){return"("+a+" === null && "+b+" === null) ? 0 :("+a+" === null ? Number.POSITIVE_INFINITY : ("+b+" === null ? Number.NEGATIVE_INFINITY : "+b+" - "+a+"));";}};function makeSortText(i){return"((a["+i+"] < b["+i+"]) ? -1 : ((a["+i+"] > b["+i+"]) ? 1 : 0));";};function makeSortTextDesc(i){return"((b["+i+"] < a["+i+"]) ? -1 : ((b["+i+"] > a["+i+"]) ? 1 : 0));";};function makeSortNumeric(i){return"a["+i+"]-b["+i+"];";};function makeSortNumericDesc(i){return"b["+i+"]-a["+i+"];";};function sortText(a,b){if(table.config.sortLocaleCompare)return a.localeCompare(b);return((a<b)?-1:((a>b)?1:0));};function sortTextDesc(a,b){if(table.config.sortLocaleCompare)return b.localeCompare(a);return((b<a)?-1:((b>a)?1:0));};function sortNumeric(a,b){return a-b;};function sortNumericDesc(a,b){return b-a;};function getCachedSortType(parsers,i){return parsers[i].type;};this.construct=function(settings){return this.each(function(){if(!this.tHead||!this.tBodies)return;var $this,$document,$headers,cache,config,shiftDown=0,sortOrder;this.config={};config=$.extend(this.config,$.tablesorter.defaults,settings);$this=$(this);$.data(this,"tablesorter",config);$headers=buildHeaders(this);this.config.parsers=buildParserCache(this,$headers);cache=buildCache(this);var sortCSS=[config.cssDesc,config.cssAsc];fixColumnWidth(this);$headers.click(function(e){var totalRows=($this[0].tBodies[0]&&$this[0].tBodies[0].rows.length)||0;if(!this.sortDisabled&&totalRows>0){$this.trigger("sortStart");var $cell=$(this);var i=this.column;this.order=this.count++%2;if(this.lockedOrder)this.order=this.lockedOrder;if(!e[config.sortMultiSortKey]){config.sortList=[];if(config.sortForce!=null){var a=config.sortForce;for(var j=0;j<a.length;j++){if(a[j][0]!=i){config.sortList.push(a[j]);}}}config.sortList.push([i,this.order]);}else{if(isValueInArray(i,config.sortList)){for(var j=0;j<config.sortList.length;j++){var s=config.sortList[j],o=config.headerList[s[0]];if(s[0]==i){o.count=s[1];o.count++;s[1]=o.count%2;}}}else{config.sortList.push([i,this.order]);}};setTimeout(function(){setHeadersCss($this[0],$headers,config.sortList,sortCSS);appendToTable($this[0],multisort($this[0],config.sortList,cache));},1);return false;}}).mousedown(function(){if(config.cancelSelection){this.onselectstart=function(){return false};return false;}});$this.bind("update",function(){var me=this;setTimeout(function(){me.config.parsers=buildParserCache(me,$headers);cache=buildCache(me);},1);}).bind("updateCell",function(e,cell){var config=this.config;var pos=[(cell.parentNode.rowIndex-1),cell.cellIndex];cache.normalized[pos[0]][pos[1]]=config.parsers[pos[1]].format(getElementText(config,cell),cell);}).bind("sorton",function(e,list){$(this).trigger("sortStart");config.sortList=list;var sortList=config.sortList;updateHeaderSortCount(this,sortList);setHeadersCss(this,$headers,sortList,sortCSS);appendToTable(this,multisort(this,sortList,cache));}).bind("appendCache",function(){appendToTable(this,cache);}).bind("applyWidgetId",function(e,id){getWidgetById(id).format(this);}).bind("applyWidgets",function(){applyWidget(this);});if($.metadata&&($(this).metadata()&&$(this).metadata().sortlist)){config.sortList=$(this).metadata().sortlist;}if(config.sortList.length>0){$this.trigger("sorton",[config.sortList]);}applyWidget(this);});};this.addParser=function(parser){var l=parsers.length,a=true;for(var i=0;i<l;i++){if(parsers[i].id.toLowerCase()==parser.id.toLowerCase()){a=false;}}if(a){parsers.push(parser);};};this.addWidget=function(widget){widgets.push(widget);};this.formatFloat=function(s){var i=parseFloat(s);return(isNaN(i))?0:i;};this.formatInt=function(s){var i=parseInt(s);return(isNaN(i))?0:i;};this.isDigit=function(s,config){return/^[-+]?\d*$/.test($.trim(s.replace(/[,.']/g,'')));};this.clearTableBody=function(table){if($.browser.msie){function empty(){while(this.firstChild)this.removeChild(this.firstChild);}empty.apply(table.tBodies[0]);}else{table.tBodies[0].innerHTML="";}};}});$.fn.extend({tablesorter:$.tablesorter.construct});var ts=$.tablesorter;ts.addParser({id:"text",is:function(s){return true;},format:function(s){return $.trim(s.toLocaleLowerCase());},type:"text"});ts.addParser({id:"digit",is:function(s,table){var c=table.config;return $.tablesorter.isDigit(s,c);},format:function(s){return $.tablesorter.formatFloat(s);},type:"numeric"});ts.addParser({id:"currency",is:function(s){return/^[£$€?.]/.test(s);},format:function(s){return $.tablesorter.formatFloat(s.replace(new RegExp(/[£$€]/g),""));},type:"numeric"});ts.addParser({id:"ipAddress",is:function(s){return/^\d{2,3}[\.]\d{2,3}[\.]\d{2,3}[\.]\d{2,3}$/.test(s);},format:function(s){var a=s.split("."),r="",l=a.length;for(var i=0;i<l;i++){var item=a[i];if(item.length==2){r+="0"+item;}else{r+=item;}}return $.tablesorter.formatFloat(r);},type:"numeric"});ts.addParser({id:"url",is:function(s){return/^(https?|ftp|file):\/\/$/.test(s);},format:function(s){return jQuery.trim(s.replace(new RegExp(/(https?|ftp|file):\/\//),''));},type:"text"});ts.addParser({id:"isoDate",is:function(s){return/^\d{4}[\/-]\d{1,2}[\/-]\d{1,2}$/.test(s);},format:function(s){return $.tablesorter.formatFloat((s!="")?new Date(s.replace(new RegExp(/-/g),"/")).getTime():"0");},type:"numeric"});ts.addParser({id:"percent",is:function(s){return/\%$/.test($.trim(s));},format:function(s){return $.tablesorter.formatFloat(s.replace(new RegExp(/%/g),""));},type:"numeric"});ts.addParser({id:"usLongDate",is:function(s){return s.match(new RegExp(/^[A-Za-z]{3,10}\.? [0-9]{1,2}, ([0-9]{4}|'?[0-9]{2}) (([0-2]?[0-9]:[0-5][0-9])|([0-1]?[0-9]:[0-5][0-9]\s(AM|PM)))$/));},format:function(s){return $.tablesorter.formatFloat(new Date(s).getTime());},type:"numeric"});ts.addParser({id:"shortDate",is:function(s){return/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(s);},format:function(s,table){var c=table.config;s=s.replace(/\-/g,"/");if(c.dateFormat=="us"){s=s.replace(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,"$3/$1/$2");}else if (c.dateFormat == "pt") {s = s.replace(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/, "$3/$2/$1");} else if(c.dateFormat=="uk"){s=s.replace(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,"$3/$2/$1");}else if(c.dateFormat=="dd/mm/yy"||c.dateFormat=="dd-mm-yy"){s=s.replace(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/,"$1/$2/$3");}return $.tablesorter.formatFloat(new Date(s).getTime());},type:"numeric"});ts.addParser({id:"time",is:function(s){return/^(([0-2]?[0-9]:[0-5][0-9])|([0-1]?[0-9]:[0-5][0-9]\s(am|pm)))$/.test(s);},format:function(s){return $.tablesorter.formatFloat(new Date("2000/01/01 "+s).getTime());},type:"numeric"});ts.addParser({id:"metadata",is:function(s){return false;},format:function(s,table,cell){var c=table.config,p=(!c.parserMetadataName)?'sortValue':c.parserMetadataName;return $(cell).metadata()[p];},type:"numeric"});ts.addWidget({id:"zebra",format:function(table){if(table.config.debug){var time=new Date();}var $tr,row=-1,odd;$("tr:visible",table.tBodies[0]).each(function(i){$tr=$(this);if(!$tr.hasClass(table.config.cssChildRow))row++;odd=(row%2==0);$tr.removeClass(table.config.widgetZebra.css[odd?0:1]).addClass(table.config.widgetZebra.css[odd?1:0])});if(table.config.debug){$.tablesorter.benchmark("Applying Zebra widget",time);}}});})(jQuery);

MeetingBooker.module('Meetings', function(Meetings, MeetingBooker, Backbone, Marionette, $, _) {
  var meetingChannel = Backbone.Radio.channel('meeting');

  Meetings.Router = Marionette.AppRouter.extend({
    appRoutes: {
      '': 'listMeetings'
    }
  });

  var MeetingManager = Marionette.Object.extend({
    listMeetings: function() {
      Meetings.List.Controller.listMeetings();
    },

    editMeeting: function (id) {
      Meetings.Edit.Controller.editMeeting(id);
    }
  });

  var meetingManager = new MeetingManager();

  // Event listeners
  meetingChannel.comply('list:meetings', function() {
    meetingManager.listMeetings();
  });

  MeetingBooker.on('edit:meeting', function(id) {
    meetingManager.editMeeting(id);
  });

  return new Meetings.Router({
    controller: meetingManager
  });
});

MeetingBooker.module('Meetings.Edit', function(Edit, MeetingBooker, Backbone, Marionette, $, _){
  var meetingChannel = Backbone.Radio.channel('meeting');

  Edit.Controller = {
    editMeeting: function(id){
      var loadingView = new MeetingBooker.CommonViews.Loading();
      MeetingBooker.getRegion('editRegion').show(loadingView);
      // Trigger a request event with id as argument. Get the promise returned by our handler.
      var fetchingMeeting = meetingChannel.request('meeting', id);
      // Wait until data is fetched before display our view
      $.when(fetchingMeeting).done(function(meeting) {
        var view;
        if(meeting !== undefined){
          view = new Edit.Meeting({
            model: meeting
          });
        }
        else {
          view = new Edit.MissingMeeting();
        }

        view.on('submit:form', function(formData) {
          $.when(meeting.save(formData))
            .done(function() {
              meetingChannel.command('list:meetings');
            })
            .fail(function() {
              console.log('Meeting is NOT updated!')
            });
        });

        view.on('close:modal', function(){
          meetingChannel.command('list:meetings');
        });

        MeetingBooker.getRegion('editRegion').show(view);
      });
    }
  }
});
MeetingBooker.module('Meetings.Edit', function(Edit, MeetingBooker, Backbone, Marionette, $, _) {

  Edit.MissingMeeting = Marionette.ItemView.extend({
    template: '#missing-meeting-view',
    className: 'ui modal',
    onShow: function() {
      $('.modal').modal('show');
    }
  });

  Edit.Meeting = Marionette.ItemView.extend({
    template: '#meeting-edit',
    className: 'ui modal',
    ui: {
      $submitBtn: '.js-submit-edit',
      $closeIcon: '.close.icon'
    },
    events: {
      'click @ui.$submitBtn': '_handleSubmit'
    },
    triggers: {
      'click @ui.$closeIcon': 'close:modal'
    },

    _handleSubmit: function(e){
      e.preventDefault();
      //Get value from an input field
      function getFieldValue(fieldId) {
        // 'get field' is part of Semantics form behavior API
        return $('.ui.form').form('get field', fieldId)[1].val();
      }

      var formData = {};

      if (getFieldValue('edit-title')) formData.title = getFieldValue('edit-title');
      if (getFieldValue('edit-date')) formData.dateClient = getFieldValue('edit-date');
      if (getFieldValue('edit-date_submit')) formData.date = getFieldValue('edit-date_submit');
      if (getFieldValue('edit-startTimeClient')) formData.startTimeClient = getFieldValue('edit-startTimeClient');
      if (getFieldValue('edit-startTimeClient_submit')) formData.startTime = getFieldValue('edit-startTimeClient_submit');
      if (getFieldValue('edit-endTimeClient')) formData.endTimeClient = getFieldValue('edit-endTimeClient');
      if (getFieldValue('edit-endTimeClient_submit')) formData.endTime = getFieldValue('edit-endTimeClient_submit');
      if (getFieldValue('edit-location')) formData.location = getFieldValue('edit-location');
      if (getFieldValue('edit-category')) formData.category = getFieldValue('edit-category');

      $('.modal').modal('hide');
      this.trigger('submit:form', formData); // Sent to edit controller
    },

    onShow: function(){
      var $meetingTitle = $('#edit-title');
      
      $('.modal')
        .modal('setting', 'closable', false)
        .modal('show')
      ;
      var title = $meetingTitle.data('title');
      $meetingTitle.val(title);
      $('.js-edit-location-dropdown').dropdown('setting', 'onChange', function(){
        $('.edit-location').addClass('mid-gray');
      });
      $('.js-edit-category-dropdown').dropdown('setting', 'onChange', function(){
        $('.edit-category').addClass('mid-gray');
      });
      $('.datepicker').pickadate({
        format: 'mmm dd, yyyy',
        formatSubmit: 'mm/dd/yyyy',
        min: true
      });
      $('.starttimepicker').pickatime({
        format: 'h:i A',
        formatSubmit: 'HH:i'
      });
      $('.endtimepicker').pickatime({
        format: 'h:i A',
        formatSubmit: 'HH:i'
      });

      $meetingTitle.focus(function(){
        $meetingTitle.removeClass('gray');
      });
    }
  });
});
MeetingBooker.module('Meetings.List', function(List, MeetingBooker, Backbone, Marionette, $, _) {
  var meetingChannel = Backbone.Radio.channel('meeting');

  // Public function
  var ListMeetingsController = Marionette.Object.extend({
    listMeetings: function() {
      var self = this;

      var loadingView = new MeetingBooker.CommonViews.Loading({
        title: 'Loading Meeting List'
      });

      MeetingBooker.getRegion('editRegion').show(loadingView);

      var fetchingMeetings = meetingChannel.request('meetings');
      $.when(fetchingMeetings).done(function(meetings) {
        if (meetings.length > 0) {
          var meetingsListView = new List.Meetings({
            collection: meetings
          });

          MeetingBooker.getRegion('meetingRegion').show(meetingsListView);
          self._setListeners(meetingsListView);
        }
      });
    },

    _setListeners: function(meetingsListView) {
      this.listenTo(meetingsListView, 'childview:edit:meeting', this._handleEditMeeting);
      this.listenTo(meetingsListView, 'childview:delete:meeting', this._handleDeleteMeeting);
    },

    _handleEditMeeting: function(childView) {
      // Trigger an event that routing controller will react to
      MeetingBooker.trigger('edit:meeting', childView.model.id); // Gets handled by edit controller via meetings_app router
      childView.flash('warning');
    },

    _handleDeleteMeeting: function(childView) {
      childView.model.destroy();
    }
  });

  List.Controller = new ListMeetingsController();
});
MeetingBooker.module('Meetings.List', function(List, MeetingBooker, Backbone, Marionette, $, _){

  List.Meeting = Marionette.ItemView.extend({
    template: '#meeting-list-item',
    tagName: 'tr',
    ui: {
      editIcon: 'i.edit.icon',
      deleteIcon: 'i.delete.icon'
    },
    events: {
      'mouseenter': 'highlightRow',
      'mouseleave': 'unhighlightRow'
    },
    triggers: {
      'click @ui.editIcon': 'edit:meeting',
      'click @ui.deleteIcon': 'delete:meeting'
    },
    highlightRow: function(e){
      this.$el.addClass('active');
    },
    unhighlightRow: function(e){
      this.$el.removeClass('active');
    },
    remove: function(){
      var self = this;
      this.$el.fadeOut(function(){
        // Tells the original remove function to remove self
        Marionette.ItemView.prototype.remove.call(self);
      });
    },
    flash: function(cssClass){
      var $view = this.$el;
      $view.hide().toggleClass(cssClass).fadeIn(800, function(){
        setTimeout(function(){
          $view.toggleClass(cssClass)
        }, 500);
      });
    }
  });

  var NoMeetingsView = Marionette.ItemView.extend({
    template: "#meeting-list-none",
    tagName: 'tr'
  });

  List.Meetings = Marionette.CompositeView.extend({
    tagName: 'table',
    className: 'ui celled sortable padded large table segment',
    template: '#meeting-list',
    childView: List.Meeting,
    childViewContainer: 'tbody',
    emptyView: NoMeetingsView,

    collectionEvents: {
      'remove': 'onMeetingDeleted'
    },

    onMeetingDeleted: function() {
      this.$el.fadeOut(400, function() {
        $(this).fadeIn(400);
      });
    },

    onShow: function() {
      this.$el.tablesorter();
    }
  });
});