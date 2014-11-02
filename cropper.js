/*
Class: Cropper

	var myCropper = new Cropper('anbase_img', {
		borderWidth: '1px',
		BorderStyle: 'dotted',
		mini: {x:160, y:120},
		onComplete:function(top,left,width,height){
			$('info_input').value="top:"+ top +"px, left:"+ left +"px, width:"+ width +"px, height:"+ height +"px";
		}
	});

*/

var Cropper = new Class({

	options : {
		vars:0,
		maskColor:'#000000',
		maskOpacity:0.3,
		mask:true,
		borderWidth:4,
		borderStyle:'solid',
		borderColor:'#ff4500',
		mini:{x:90,y:90},
		onComplete:Class.empty,
		resizerWidth:0,
		resizable:true,
		keepRatio:true
	},

	initialize : function(target,options){
		this.setOptions(options);
		this.target=$(target);

		this.buildCropper();
		if(this.options.mask)
		{
			this.buildMask();
		}

		this.drag = new Drag.Move(this.resizer,{
			container:this.target,
			handle:this.dragger,
			onComplete:function(){
				var coord1 = this.resizer.getCoordinates();
				this.top = coord1.top-this.target_coord.top;
				this.left = coord1.left-this.target_coord.left;
				this.width = coord1.width;
				this.height = coord1.height;
				this.fireEvent('onComplete',[this.top,this.left,this.width,this.height]);
			}.bind(this),
			onDrag:function(){
				var coord1 = this.resizer.getCoordinates();
				this.dragger.setStyle('top',coord1.top);
				this.dragger.setStyle('left',coord1.left);
				if(this.options.mask)
				{
					this.updateMask();
				}
			}.bind(this)
		});


		if(this.options.resizable)
		{

			if(this.options.keepRatio)
			{
				this.ratio=this.options.mini.x/this.options.mini.y;
			}
			this.resize = this.resizer.makeResizable({
				limit:{
					x:[this.options.mini.x.toInt()-this.margin],
					y:[this.options.mini.y.toInt()-this.margin]
				},
				onComplete:function(){

					this.resize.fireEvent('onDrag');

					this.drag.fireEvent('onComplete');
				}.bind(this),
				onDrag:function(){
					var coord1=this.resizer.getCoordinates();
					this.dragger.setStyle('height',(coord1.height).toInt()-18+'px');
					this.dragger.setStyle('width',(coord1.width).toInt()-18+'px');
					if(this.options.keepRatio)
					{
						this.resizer.setStyle('width',(coord1.height*this.ratio-this.margin).toInt()+'px');
						if(coord1.bottom>this.target_coord.bottom)
						{
							var bound = this.target_coord.bottom-coord1.top;
							this.resizer.setStyles({'width':(bound*this.ratio).toInt()-this.margin+'px','height':bound-this.margin+'px'});
						}
						if(coord1.right>this.target_coord.right)
						{
							var bound = this.target_coord.right-coord1.left;
							this.resizer.setStyles({'width':bound-this.margin+'px','height':(bound/this.ratio).toInt()-this.margin+'px'});
						}
					}
					else
					{
						if(coord1.right>this.target_coord.right)
						{
							var bound = this.target_coord.right-coord1.left-this.margin+'px';
							this.resizer.setStyles({'width':bound,'height':bound});
						}
						if(coord1.bottom>this.target_coord.bottom)
						{
							var bound = this.target_coord.bottom-coord1.top-this.margin+'px';
							this.resizer.setStyles({'width':bound,'height':bound});
						}
					}
					this.drag.fireEvent('onDrag');
				}.bind(this)
			});
		}
		if (this.options.initialize) this.options.initialize.call(this);
		return this;
	},

	buildCropper : function(){
		var imgSize = this.target.getSize();
		this.wrapper = new Element('div');
		this.wrapper.setProperty('id','wraper_'+this.options.vars);
		this.wrapper.setProperty('class','crop_wraper');
		this.wrapper.setStyles({
			margin : this.target.getStyle('margin'),
			padding : this.target.getStyle('padding'),
			border : this.target.getStyle('border'),
			width: imgSize.size.x
		});
		this.wrapper.injectAfter(this.target);
		this.wrapper.adopt(this.target);
		this.target.setStyles({
			margin : 0,
			padding : 0,
			border : 0
		});

		this.target_coord=this.target.getCoordinates();

		this.margin=2*this.options.borderWidth.toInt() + this.options.resizerWidth.toInt();

		this.resizer = new Element('div');
		this.resizer.setProperty('id','risezer_'+this.options.vars)
		this.resizer.setStyles({
			position:'absolute',
			display:'block',
			'z-index':'9997',
			border:this.options.borderWidth.toInt() + "px " + this.options.borderStyle + " " + this.options.borderColor,
			width:this.options.mini.x.toInt() - this.margin + "px",
			height:this.options.mini.y.toInt() - this.margin + "px",
			left:(this.target_coord.left+(this.target_coord.width/2)-(this.options.mini.x.toInt()/2)).toInt()+'px',
			top:(this.target_coord.top+(this.target_coord.height/2)-(this.options.mini.y.toInt()/2)).toInt()+'px',
			padding:'0 ' + this.options.resizerWidth.toInt() + 'px ' + this.options.resizerWidth.toInt()+ 'px 0',
			cursor: 'nw-resize'
		});
		this.resizer.injectAfter(this.target);

		this.dragger = new Element('div');
		this.dragger.setStyles({
			position:'absolute',
			display:'block',
			rel:'cropUtil',
			'z-index':'9998',
			width:this.options.mini.x.toInt() - this.margin + "px",
			height:this.options.mini.y.toInt() - this.margin + "px",
			left:(this.target_coord.left+(this.target_coord.width/2)-(this.options.mini.x.toInt()/2)).toInt()+'px',
			top:(this.target_coord.top+(this.target_coord.height/2)-(this.options.mini.y.toInt()/2)).toInt()+'px',
			padding:'0 ' + this.options.resizerWidth.toInt() + 'px ' + this.options.resizerWidth.toInt()+ 'px 0',
			cursor:'move'
		});
		this.dragger.injectAfter(this.target);
		this.saver = new Element('input');
		this.saver.setProperties({
			'type':'button',
			'value':'保存选区',
			'id':'saveCropBtn',
			'class':'cropBtn'//,
			//'onclick':'javascript:saveCrop('+this.options.vars+')'
		});
		this.saver.setStyles({
			'margin':'8px 0 0 8px'
		});
		var myTarget = this.target;
		var myResizer = this.resizer;
		var myWrapper = this.wrapper;
		var myDragger = this.dragger;
		var mySaver = this.saver;
		this.saver.addEvent('click',function(){
			var imgSize = myTarget.getSize();
			var imgWidth = imgSize.size.x;
			var imgHeight = imgSize.size.y;

			var cropTop = myResizer.getStyle('top');
			var cropLeft = myResizer.getStyle('left');
			var boxSize = myResizer.getSize();
			var cropWidth = boxSize.size.x;
			var cropHeight = boxSize.size.y;

			//alert('图像宽高:'+imgWidth+'/'+imgHeight+', 切割起点左:'+cropTop+'/'+cropLeft+', 切割高宽:'+cropWidth+'/'+cropHeight+'');

			var pAjax = new Ajax("/crop/crop.php", {
				method: 'post',
				data:{
					imgWidth:imgWidth,
					imgHeight:imgHeight,
					cropTop:cropTop,
					cropLeft:cropLeft,
					cropWidth:cropWidth,
					cropHeight:cropHeight
				},
				onComplete: function(){
					$('saveCropBtn').removeProperty('disabled');
					$('saveCropBtn').setProperty('value','保存成功');
					(function(){
							var cropUtils = myWrapper.getElements('div');
							cropUtils.each(function(element){
								element.remove();
							})
							myWrapper.replaceWith(myTarget);
							$('triggerBtn').removeProperty('disabled');
						}
					).delay(1100);
				}
			}).request();
		});
		this.saver.injectInside(myDragger);

		if(window.ie)
		{
			this.resizer.setStyle('background','url(shim.gif)');
		}
	},

	buildMask : function(){
		this.rezr_coord = this.resizer.getCoordinates();
		this.mask_top = new Element('div');
		this.mask_top.setStyles({
			position:'absolute',
			rel:'cropUtil',
			top:this.target_coord.top+'px',
			left:this.target_coord.left+'px',
			width:this.target_coord.width+'px',
			height:this.rezr_coord.top-this.target_coord.top+'px',
			backgroundColor:this.options.maskColor,
			padding:0,
			margin:0
		});
		this.mask_top.setHTML('<!--top-->');
		this.mask_top.setOpacity(this.options.maskOpacity);
		this.mask_left = new Element('div');
		this.mask_left.setStyles({
			position:'absolute',
			rel:'cropUtil',
			top:this.rezr_coord.top+'px',
			left:this.target_coord.left+'px',
			width:this.rezr_coord.left-this.target_coord.left+'px',
			height:this.rezr_coord.height+'px',
			backgroundColor:this.options.maskColor,
			padding:0,
			margin:0
		});
		this.mask_left.setHTML('<!--left-->');
		this.mask_left.setOpacity(this.options.maskOpacity);
		this.mask_right = new Element('div');
		this.mask_right.setStyles({
			position:'absolute',
			rel:'cropUtil',
			top:this.rezr_coord.top+'px',
			left:this.rezr_coord.right+'px',
			width:this.target_coord.right-this.rezr_coord.right+'px',
			height:this.rezr_coord.height+'px',
			backgroundColor:this.options.maskColor,
			padding:0,
			margin:0
		});
		this.mask_right.setHTML('<!--right-->');
		this.mask_right.setOpacity(this.options.maskOpacity);
		this.mask_bottom = new Element('div');
		this.mask_bottom.setStyles({
			position:'absolute',
			rel:'cropUtil',
			top:this.rezr_coord.bottom+'px',
			left:this.target_coord.left+'px',
			width:this.target_coord.width+'px',
			height:this.target_coord.bottom-this.rezr_coord.bottom+'px',
			backgroundColor:this.options.maskColor,
			padding:0,
			margin:0
		});
		this.mask_bottom.setHTML('<!--bottom-->');
		this.mask_bottom.setOpacity(this.options.maskOpacity);
		this.mask_top.injectAfter(this.resizer);
		this.mask_left.injectAfter(this.resizer);
		this.mask_right.injectAfter(this.resizer);
		this.mask_bottom.injectAfter(this.resizer);
	},

	updateMask : function(){
		var coord1=this.resizer.getCoordinates();
		this.mask_top.setStyles({
			top:this.target_coord.top+'px',
			left:this.target_coord.left+'px',
			width:this.target_coord.width+'px',
			height:coord1.top-this.target_coord.top+'px'
		});
		this.mask_left.setStyles({
			top:coord1.top+'px',
			left:this.target_coord.left+'px',
			width:coord1.left-this.target_coord.left+'px',
			height:coord1.height+'px'
		});
		this.mask_right.setStyles({
			top:coord1.top+'px',
			left:coord1.right+'px',
			width:this.target_coord.right-coord1.right+'px',
			height:coord1.height+'px'
		});
		this.mask_bottom.setStyles({
			top:coord1.bottom+'px',
			left:this.target_coord.left+'px',
			width:this.target_coord.width+'px',
			height:this.target_coord.bottom-coord1.bottom+'px'
		});
	}
});
Cropper.implement(new Events, new Options);