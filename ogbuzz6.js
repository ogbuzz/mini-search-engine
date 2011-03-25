//~// Open Source Code - MIT License Copyright (c) 2011 Sylvain Picker Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.



if(typeof Object.keys!=='function'){
    Object.keys=function(hash){
       var keys=[],p;
       for(p in hash){hash.hasOwnProperty(p) && keys.push(p);}
       return keys;
    };
}



var base={
	loadScript:function(url,callback){
		var script=document.createElement('script');
		script.type='text/javascript';
		if(script.readyState){  //IE
			script.onreadystatechange=function(){
				if (script.readyState==='loaded'||script.readyState==='complete'){
					script.onreadystatechange=null;
					callback();
				}
			};
		}else{script.onload=function(){callback();};}
		script.src=url;
		document.getElementsByTagName('head')[0].appendChild(script);
	},
	supportHashchange:function(){
		var doc_mode=document.documentMode;
		return 'onhashchange' in window && (doc_mode===undefined || doc_mode > 7);
	},
	makeSearchLink:function(link){
		link.onclick=function(){
			var hash=window.location.hash,searchLink;
			if(hash==='#'){hash='';}
			searchLink=this.href+hash;
			if(window.location.href===searchLink){return false;}
			else{this.href=searchLink;return true;}
		};
	},
	basicListAccents:[
		{A:/[\u00fd\u00ff]/g,R:"y"},
		{A:/[\u00f1]/g,R:"n"},
		{A:/[\u0153]/g,R:"oe"},
		{A:/[\u00e6]/g,R:"ae"},
		{A:/[\u00e7]/g,R:"c"},
		{A:/[\u00e0\u00e1\u00e2\u00e3\u00e4\u00e5]/g,R:"a"},
		{A:/[\u00e8\u00e9\u00ea\u00eb]/g,R:"e"},
		{A:/[\u00ec\u00ed\u00ee\u00ef]/g,R:"i"},
		{A:/[\u00f2\u00f3\u00f4\u00f5\u00f6]/g,R:"o"},
		{A:/[\u00f9\u00fa\u00fb\u00fc]/g,R:"u"}
	],
	toBasic:function(listAccents){
		return function(aString){
			var accents=listAccents,i;
			aString=aString.toLowerCase()||'';
		    for(i=listAccents.length;i--;){aString=aString.replace(accents[i].A,accents[i].R);}
		    return aString;
	    };
	},
	getWords:function(words){
		(typeof words==='string') ? words=words.toLowerCase() : words='';
		return words.match(/[^\s\’\‘\"\'\.\/\(\)\“…,;:\#\-–•«»]+/g)||[];
	},
	makeWeights:function(n,start){
		var weight=start,weights=[weight],i;
		for(i=1;i<n;i+=1){weights.push(weight+=weight);}
		return weights;
	},
	basicJsonToHtml:function(data,jsonToHtml){
		var i,dataToShowArray;
		return function(numberRows){
			dataToShowArray=[];
			for(i=numberRows.length;i--;){
				dataToShowArray[i]=jsonToHtml(data[numberRows[i]]);
			}
			return dataToShowArray.join('');
		};
	},
	basicJsoneur:function(row){
		var citation;
		if(row[5]===''){citation='';}
		else{citation='<p><q>'+row[5]+'</q></p>';}
		return '<div class="v"><h1>'+row[0]+'</h1><a href="http://'+row[1]+'"><p>'+row[1]+'</p></a>'+citation+'<p class="g">'+row[4]+'</p><span><p>'+row[6]+'</p><p>'+row[7]+'</p></span><b>'+row[8]+'</b></div>';
	},
	messages:{
		nbSuggestions:{fr:'Nombre de suggestions: ',en:'Number of suggestions: '},
		nbResults:{fr:'Nombre de résultats: ',en:'Number of results: '},
		more:{fr:'Plus de résultats',en:'More Results'},
		clickBox:{fr:'Cliquez dans la boite de recherche pour l\'effacer',en:'Click in search-box to clear results'}
	},
	hashArray:function(wordsArray){window.location.hash=wordsArray.join(',').toLowerCase();},
	getPageSelection:function(){
		var selection;
		if(window.getSelection){selection=window.getSelection();}
		else if(document.selection){selection=document.selection.createRange();} // Opera!
		if(selection.text){selection=selection.text;} // ie6
		selection=selection+''; // IMPORTANT
		if(selection==='[object]'){selection='';} // ie
		return selection;
	},
	memoryBase:function(){return {'results':{},'basic':[],'accents':{'basic':[],'words':[]}};},
	enterWord:function(toBasicWord,memory){
		return function(word,Row,Column){
			word=word.toLowerCase();
			if(memory.results[word]===undefined){
				memory.results[word]=[];
				if(word===toBasicWord(word)){//~ if(word===basicWord){
					memory.basic.push(word);
				}else{
					memory.accents.basic.push(toBasicWord(word));//~ memory.accents.basic.push(basicWord);
					memory.accents.words.push(word);
				}
			}
			if(memory.results[word][Column]===undefined){memory.results[word][Column]=[];}
			memory.results[word][Column].push(Row);
		};
	},
	enterData:function(getWords,enterWord){
		return function(data,Row,Column){
			var words=getWords(data),i;
			for(i=words.length;i--;){enterWord(words[i],Row,Column);}
		};
	},
	indexData:function(collumns,enterData){
		var method=function(data){
			var memColl,dataRow,Row;
			for(Row=data.length;Row--;){
				dataRow=data[Row];
				for(memColl=collumns.length;memColl--;){enterData(dataRow[collumns[memColl]],Row,memColl);}
			}
			return data;
		};
		return method;
	},
	metaMemory:function(collumnsWeights){
		var i,weights=[],
			collumnsOrder=Object.keys(collumnsWeights),
			memory=base.memoryBase(),
			getWords=base.getWords,
			toBasic=base.toBasic(base.basicListAccents),
			indexData=base.indexData(collumnsOrder,base.enterData(getWords,base.enterWord(toBasic,memory)));

		for(i=collumnsOrder.length;i--;){weights[i]=collumnsWeights[collumnsOrder[i]];}

		var that={
			index:function(data){indexData(data);},
			suggest:base.suggest(memory,toBasic),
			memory:memory,
			searchWords:[],
			getWords:getWords,
			cache:{},
			rowSorter:base.rowSorter(),
			clear:function(){that.searchWords=[];that.cache={};},
			collumnsWeights:weights
		};
		return that;
	},
	iterateResultsList:function(listResults){
		return function(results,method){
			var result,i;
			for(i=listResults.length;i--;){result=method(result,results,listResults[i]);}
			return result;
		};
	},
	searchIterator:function(result,results,method){
		if(result===undefined){result=[];}
		result=results[method].concat(result);
		return result;
	},
	listResultsWeightRank:function(keys,resultsWeights){
		return function(results,rank){
			var list=[],key,result,weight,i,r;
			for(i=keys.length;i--;){
				key=keys[i];
				result=results[key]||[];
				weight=(resultsWeights[key]*rank);
				for(r=result.length;r--;){
					list.push([result[r],weight]);
				}
			}
			return list;
		};
	},
	suggest:function(index,toBasicWord){
		return function(word,O){
			var	i,
				perfect=[],
				nearlyPerfect=[],
				basicBegin=[],
				basicInside=[],
				accentsBegin=[],
				accentsInside=[],
				needHighlight=function(){
					var i,results=[perfect,nearlyPerfect,basicBegin,basicInside];
					for(i=results.length;i--;){if(results[i].length>0){return true;}}
					return false;
				},
				highlight={},
				indexBasic,
				indexAccents,
				found,
				basicWord,
				basicWordInIndex,
				accentWord,
				isBasic;

			word=word.toLowerCase();
			basicWord=toBasicWord(word);
			if(word!==basicWord){highlight[basicWord]='';}
			isBasic=(word===basicWord);
			basicWord=basicWord.replace(/^\s+|\s+$/g,'');
			indexBasic=index.basic;
			for(i=indexBasic.length;i--;){
				basicWordInIndex=indexBasic[i];
				found=basicWordInIndex.indexOf(basicWord);
				if(basicWordInIndex===word){perfect.push(basicWordInIndex);}
				else if(found===0){
					if(basicWord===basicWordInIndex){nearlyPerfect.push(basicWordInIndex);}
					else{basicBegin.push(basicWordInIndex);}
				}
				else if(found>0){basicInside.push(basicWordInIndex);}
			}
			indexBasic=index.accents.basic;
			indexAccents=index.accents.words;
			for(i=indexBasic.length;i--;){
				basicWordInIndex=indexBasic[i];
				accentWord=indexAccents[i];
				found=basicWordInIndex.indexOf(basicWord);
				if(found>-1){
					highlight[accentWord.slice(found,(found+word.length))]='';
					if(accentWord===word){perfect.push(accentWord);}
					else if(found === 0){
						if(basicWordInIndex===word){nearlyPerfect.push(accentWord);}
						else{accentsBegin.push(accentWord);}
					}
					else if(found > 0){accentsInside.push(accentWord);}
				}
			}
			if(needHighlight()){highlight[word]='';}
			if(!O){O={};}
			O.word=word;
			O.isBasic=isBasic;
			O.perfect=perfect;
			O.nearlyPerfect=nearlyPerfect;
			O.basicBegin=basicBegin;
			O.accentsBegin=accentsBegin;
			O.basicInside=basicInside;
			O.accentsInside=accentsInside;
			O.highlight=Object.keys(highlight);
			return O;
		};
	},
	rowSorter:function(){
		var rows,
			weights,
			method=function(dataRow,weight){
				if(weights[dataRow]===undefined){
					rows.push(dataRow);
					weights[dataRow]=weight;
				}
				else{weights[dataRow]+=weight;}
			};
		method.getRows=function(){return rows.sort(function(a,b){return weights[b]-weights[a];})||[];};
		method.getNumberResults=function(){return rows.length;};
		method.reset=function(){rows=[];weights={};return method;};
		method.reset();
	 return method;
	},
	color:function(html,list){
		var i,reg,O={};
		for(i=list.length;i--;){O[list[i]]=true;}
		list=Object.keys(O);
		list=list.sort(function(a,b){return a.length-b.length;});
		for(i=list.length;i--;){
			reg=new RegExp("(?![^<>]*>)("+list[i]+")","gi");
			html=html.replace(reg,'<i>$1</i>');
		}
		return html;
	},
	nextCut:function(amount){
		var nextCuts,
			method=function(){
				if(amount<=nextCuts.length){return nextCuts.splice(0,amount);}
				else{return nextCuts.splice(0,nextCuts.length);}
			};
		method.set=function(list){nextCuts=list;};
		method.hasNext=function(){return (nextCuts.length>0) ? true:false;};
		return method;
	},
	getBaseOfWord:function(word){// CAREFUL INCOMPATIBLE with the searchEngine suggestions model
		if(word.length<=3){return word;}else{word=word.slice(0,4);}
		return word;
	},
	inject:function(elClass){
		return function(dom,html){
			var that=document.createElement(elClass);
			dom.appendChild(that);
			that.innerHTML=html;
		};
	},
	stopBubble:function(e){
		var e=e||window.event;
		(e.stopPropagation) ? e.stopPropagation() : e.cancelBubble=true;
	},
	init:{
		id:function(list,id){
			var i,data=list[id],keys=Object.keys(data),that;
			for(i=keys.length;i--;){
				data[keys[i]]=document.getElementById(data[keys[i]]);
			}
		}
	}
};



var searchEngine=function(language,data,jsonToHtml){
	var	model=base.metaMemory({1:3,5:2,4:2,6:3,8:5,7:4,0:200}),
		view={id:{index:'index',suggestions:'suggestions',messages:'messages',box:'box',info:'info',results:'results',next:'next'}},
		controler={};

	model.index(data);
	base.init.id(view,'id');
	view.id.next.style.display='none';


	model.next=base.nextCut(20);
	model.basicResultsWeights={'perfect':100,'nearlyPerfect':90,'accentsBegin':4,'basicBegin':3,'accentsInside':2,'basicInside':1};
	model.KEYS_RESULTS_WEIGHTS=Object.keys(model.basicResultsWeights);
	model.getSuggestions=(function(){
		var rankDecorateResults=base.iterateResultsList(model.KEYS_RESULTS_WEIGHTS),
			getSuggestionList=function(that){return rankDecorateResults(that,base.searchIterator);};
		return function(word){
			var suggestions;
			if(model.cache[word]){
				suggestions=getSuggestionList(model.cache[word])||[];
				if(suggestions[0]===word.toLowerCase()){suggestions.shift();}
				return suggestions.join(' ');
			}
			return '';
		};
	}());
	model.putSearchInCache=function(wordsString){
		var i,word,
			memory=model.cache,
			words=model.getWords(wordsString);
		model.searchWords=words;
		for(i=words.length;i--;){
			word=words[i];
			if(memory[word]===undefined){memory[word]=model.suggest(word);}
		}
		model.next.set(model.getRows());
	};
	model.getHighlight=function(){
		var i,list=[],
			memory=model.cache,
			searchWords=model.searchWords;
		for(i=searchWords.length;i--;){list=list.concat(memory[searchWords[i]].highlight);}
		return list;
	};
	model.getRows=(function(){
		var listResultsWeightRank=base.listResultsWeightRank(model.KEYS_RESULTS_WEIGHTS,model.basicResultsWeights);
		return function(){
			var i,c,C,
				memory=model.cache,
				ranks=base.makeWeights(model.searchWords.length,10),
				list=[],
				thatMemory=model.memory.results,
				thatSorter=model.rowSorter.reset(),
				word,
				weight,
				resultWeight,
				collumn,
				collumns,
				searchWords=model.searchWords;

			for(i=searchWords.length;i--;){list=list.concat(listResultsWeightRank(memory[searchWords[i]],ranks[i]));}
			for(i=list.length;i--;){
				word=list[i][0];
				weight=list[i][1];
				collumns=thatMemory[word];
				for(c=collumns.length;c--;){
					resultWeight=model.collumnsWeights[c]*weight;
					collumn=collumns[c];
					if(collumn){for(C=collumn.length;C--;){thatSorter(collumn[C],resultWeight);}}}
			}
			return thatSorter.getRows();
		};
	}());
	model.getLastSuggestions=function(){return model.getSuggestions(model.searchWords[model.searchWords.length-1]);};
	//~ model.getLastSuggestions=function(){return model.getSuggestions(base.getBaseOfWord(model.searchWords[model.searchWords.length-1]));}; // INCOMPATIBLE AVEC LE SYSTEME ACTUEL QUI CLASSE LES SUGGESTIONS VUE PAR L'UTILISATEUR ET ENLEVE LES DOUBLONS
	model.getAll=function(){
		var i,list=[];
		for(i=data.length;i--;){list[i]=i;}
		model.next.set(list);
	};





	view.inject=(function(){
		var inject=base.inject('span');
		return function(id,html){if(html!==undefined){inject(view.id[id],html);}};
	}());
	view.show=function(id,html){if(html!==undefined){view.id[id].innerHTML=html;}};
	//~ view.basicJsonToHtml=base.basicJsonToHtml(data,base.basicJsoneur);
	view.basicJsonToHtml=base.basicJsonToHtml(data,jsonToHtml);
	view.color=base.color;
	view.next=function(that){
		if(that.next.hasNext()){
			view.inject('messages',view.color(view.basicJsonToHtml(that.next()),that.getHighlight()));
			view.id.next.style.display='block';
		}
		(that.next.hasNext()) ? view.id.next.style.display='' : view.id.next.style.display='none';
	};
	view.clear=function(){
		base.hashArray([]);
		view.asyncResults.clear();
		view.show('suggestions','');
		view.show('info','');
		view.show('messages','');
		view.id.next.style.display='none';
	};
	view.timer=null;
	view.asyncResults=function(that){
		view.timer=window.setTimeout(function(){
			view.show('suggestions',that.getLastSuggestions());
			view.timer=window.setTimeout(function(){
				base.hashArray(that.searchWords);
				view.show('info',base.messages.nbResults[language]+model.getRows().length);
				view.show('messages','');
				view.next(that);
			},250);
		},100);
	};
	view.asyncResults.clear=function(){window.clearTimeout(view.timer);};
	view.results=function(that){
		view.id.box.focus();
		base.hashArray(that.searchWords);
		view.show('suggestions',that.getLastSuggestions());
		view.show('info',base.messages.nbResults[language]+model.getRows().length);
		view.show('messages','');
		view.next(that);
	};
	view.letPageScroll=function(e){
		var E=e||window.event;
		E=E.keyCode;
		if(E===38||E===40){view.id.box.blur();}
	};





	controler.clear=function(){
		view.clear();
		model.clear();
	};
	controler.searchHash=(function(){
		var permission=true,timer;
		var method=function(){
			var search;
			if(permission===true){
				search=model.getWords(decodeURIComponent(window.location.hash)).join(' ');
				view.id.box.value=search;
				model.putSearchInCache(search);
				view.id.next.style.display='none';
				view.results(model);
			}
		};
		method.pause=function(){
			permission=false;
			window.setTimeout(function(){permission=true;},50);
		};
		return method;
	}());
	controler.searchPageSelection=function(){
		var	word=base.getPageSelection();
		if(model.getWords(word).join()===model.searchWords.join()){return false;}
		controler.searchHash.pause();
		model.putSearchInCache(word);
		view.id.box.value=word;
		view.id.next.style.display='none';
		view.results(model);
		return false;
	};
	controler.asyncSearch=function(){
		var search=view.id.box.value||'';
		if(model.getWords(search).join()===model.searchWords.join()){return;}
		if(search===''){controler.viewAll();}
		//~ if(search===''){controler.clear();}
		else{
			controler.searchHash.pause();
			model.putSearchInCache(search);
			view.id.next.style.display='none';
			view.asyncResults(model);
		}
	};
	controler.clearBox=function(){
		controler.clear();
		view.id.box.value='';
	};
	controler.viewAll=function(){
		controler.searchHash.pause();
		controler.clearBox();
		model.getAll();
		view.next(model);
	};



	if(base.supportHashchange()){window.onhashchange=controler.searchHash;}
	else{
		base.loadScript(
			'js/jquery-1.4.4.min.js',
			function(){base.loadScript(
				'js/jquery.ba-hashchange.min.js',
				function(){$(window).bind('hashchange',controler.searchHash);}
			);}
		);
	}

	view.id.next.onmouseover=function(){
		document.body.style.cursor='pointer';
		this.className='ho';
	};
	view.id.next.onmouseout=function(){
		document.body.style.cursor='';
		this.className='';
	};
	view.id.next.innerHTML=base.messages.more[language];
	view.id.next.onmousedown=function(){view.next(model);};

	view.id.box.onkeydown=view.asyncResults.clear;
	view.id.box.onkeyup=controler.asyncSearch;
	view.id.box.ondblclick=function(e){
		base.stopBubble(e);
		controler.viewAll();
	};

	document.body.ondblclick=controler.searchPageSelection;
	document.onkeydown=function(e){view.letPageScroll(e);};

	var hash=window.location.hash;
	if(hash==='#'){hash='';}
	(hash.length>0) ? controler.searchHash() : controler.viewAll();
};
