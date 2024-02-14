function setExRange (id) {
	let root = document.getElementById(id);
	let mainEl = root;
	let leftRange = root.querySelector(".left-bound");
	let rightRange = root.querySelector(".right-bound");
	leftRange.value = leftRange.min = rightRange.min = mainEl.dataset.rangeMin;
	rightRange.value = leftRange.max = rightRange.max = mainEl.dataset.rangeMax;
	let el;
	root.querySelectorAll(".control-el").forEach((e) => e.ondragstart = () => false);
	root.querySelector(".custom-range").addEventListener("pointerdown", function(e){
		el = e.target.closest(".control-el");
		if(!el) return;
		el.setPointerCapture(e.pointerId);
		el.parentNode.addEventListener("pointermove", moving);
		document.body.addEventListener("pointerup", checkUpPointer);
	})
	function checkUpPointer (e)
	{
		el.parentNode.removeEventListener("pointermove", moving);
		document.body.removeEventListener("pointerup", checkUpPointer);
	}
	function parseIntEx (v) {
		return v == "" ? 0 : parseInt(v);
	}
	let collised = false;
	function moving (e)
	{
		let lineSize = root.querySelector(".custrange-line").getBoundingClientRect();
		let elSize = el.getBoundingClientRect();
		if(el.classList.contains("custrange-right-bound")){
			let realOffset = lineSize.right - e.clientX, rangeOffset;
			let maxRange = parseIntEx(rightRange.max), minRange = parseIntEx(rightRange.min);
			if((realOffset < 0 || realOffset > lineSize.width) && collised) return;
			if(realOffset < 0)
			{
				rangeOffset = 0;
				realOffset = 0;
			}
			else if(realOffset > lineSize.width) 
			{
				rangeOffset = maxRange-minRange;
				realOffset = lineSize.width;
			}
			else
			{
				collised = false;
				rangeOffset = (maxRange-minRange)*realOffset/lineSize.width
				if(maxRange - rangeOffset < parseIntEx(leftRange.value))
				{
					rangeOffset = maxRange - parseIntEx(leftRange.value);
					realOffset = lineSize.width*rangeOffset/(maxRange-minRange);
					collised = true;
				}
			}
			el.style.right = realOffset + "px";
			rightRange.value = maxRange-rangeOffset;
			el.firstChild.innerHTML = rightRange.value;
		}
		else {
			let realOffset = e.clientX-lineSize.x, rangeOffset;
			let maxRange = parseIntEx(leftRange.max), minRange = parseIntEx(leftRange.min);
			if((realOffset < 0 || realOffset > lineSize.width) && collised) return;
			if(realOffset < 0)
			{
				rangeOffset = 0;
				realOffset = 0;
			}
			else if(realOffset > lineSize.width) 
			{
				rangeOffset = maxRange-minRange;
				realOffset = lineSize.width;
			}
			else
			{
				collised = false;
				rangeOffset = (maxRange-minRange)*realOffset/lineSize.width
				if(minRange + rangeOffset > parseIntEx(rightRange.value))
				{
					rangeOffset = parseIntEx(rightRange.value) - minRange;
					realOffset = lineSize.width*rangeOffset/(maxRange-minRange);
					collised = true;
				}
			}
			el.style.left = realOffset + "px";
			leftRange.value = rangeOffset + minRange;
			el.firstChild.innerHTML = leftRange.value;
		}
	}
}

function getRangeById(id) {
	let root = document.getElementById(id);

	let min = parseInt(root.querySelector(".left-bound").value);
	let max = parseInt(root.querySelector(".right-bound").value);

	return Range.create(min, max);
}

document.addEventListener("DOMContentLoaded", () => {
	document.querySelectorAll(".exRange-main").forEach(el => setExRange(el.id));
});