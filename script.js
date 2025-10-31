// Helpers
const $ = id => document.getElementById(id);
const fmt = (n, cur='COP') => {
  if (n===null||isNaN(n)) return '-';
  try{
    return new Intl.NumberFormat('es-CO',{style:'currency',currency: cur}).format(n);
  }catch(e){
    return n.toFixed(2);
  }
}

function syncMaterialPrice(){
  const mat = document.querySelector('#material').selectedOptions[0];
  const price = mat.dataset.pricekg;
  $('pricePerKg').value = price;
}
document.querySelector('#material').addEventListener('change', syncMaterialPrice);
document.addEventListener('DOMContentLoaded', syncMaterialPrice);

function calculate(){
  const cur = $('currency').value;
  const part = $('partName').value || 'Pieza';
  const quantity = Number($('quantity').value) || 1;
  const vol = Number($('volume').value) || 0;
  const weightInput = Number($('weight').value) || 0;
  const matOpt = document.querySelector('#material').selectedOptions[0];
  const density = Number(matOpt.dataset.density) || 1;
  const pricePerKg = Number($('pricePerKg').value) || 0; // in currency per kg
  const wastePct = Number($('wastePercent').value) || 0;
  const printHours = Number($('printHours').value) || 0;
  const machineCostHr = Number($('machineCost').value) || 0;
  const finishing = Number($('finishingCost').value) || 0;
  const marginPct = Number($('margin').value) || 0;
  const taxPct = Number($('tax').value) || 0;

  // Compute weight: prefer user weight if provided else estimate from volume and density
  let weightGr = weightInput > 0 ? weightInput : (vol * density);
  // Add waste / supports
  weightGr = weightGr * (1 + wastePct/100);

  // Material cost: pricePerKg is per kg -> per gram = /1000
  const materialCost = (weightGr/1000) * pricePerKg;

  // Machine cost
  const machineCost = printHours * machineCostHr;

  // Subtotal (before tax/margin)
  const subtotal = materialCost + machineCost + finishing;

  const taxVal = subtotal * (taxPct/100);

  // Apply margin on subtotal
  const marginVal = subtotal * (marginPct/100);

  const unitPrice = subtotal + marginVal + taxVal;
  const totalPrice = unitPrice * quantity;

  // Populate results
  $('res-piece').textContent = part + ' × ' + quantity;
  $('res-material').textContent = (Math.round(weightGr*10)/10) + ' g';
  $('res-material-cost').textContent = fmt(materialCost, cur);
  $('res-machine-cost').textContent = fmt(machineCost, cur) + ' (' + printHours + ' h)';
  $('res-finishing').textContent = fmt(finishing, cur);
  $('res-subtotal').textContent = fmt(subtotal, cur);
  $('res-tax').textContent = fmt(taxVal, cur) + ' ('+ taxPct + '%)';
  $('res-margin-val').textContent = fmt(marginVal, cur) + ' ('+ marginPct + '%)';
  $('res-unit').textContent = fmt(unitPrice, cur);
  $('res-total').textContent = fmt(totalPrice, cur);

  return {
    currency: cur,
    part,
    quantity,
    weightGr: Math.round(weightGr*10)/10,
    materialCost,
    machineCost,
    finishing,
    subtotal,
    taxVal,
    marginVal,
    unitPrice,
    totalPrice
  }
}

$('calc').addEventListener('click', ()=>{
  calculate();
});

$('reset').addEventListener('click', ()=>{
  document.querySelectorAll('input').forEach(i=>{ if (i.id!=='machineCost' && i.id !== 'finishingCost' && i.id !== 'margin' && i.id !== 'quantity') i.value='';});
  syncMaterialPrice();
  ['res-piece','res-material','res-material-cost','res-machine-cost','res-finishing','res-subtotal','res-tax','res-margin-val','res-unit','res-total'].forEach(id=>$(id).textContent='-');
});

$('copy').addEventListener('click', ()=>{
  const r = calculate();
  const cur = r.currency;
  const txt = `Cotización - ${r.part}\nCantidad: ${r.quantity}\nPeso estimado: ${r.weightGr} g\nCosto material: ${new Intl.NumberFormat('es-CO',{style:'currency',currency:cur}).format(r.materialCost)}\nCosto máquina: ${new Intl.NumberFormat('es-CO',{style:'currency',currency:cur}).format(r.machineCost)}\nMano de obra: ${new Intl.NumberFormat('es-CO',{style:'currency',currency:cur}).format(r.finishing)}\nSubtotal: ${new Intl.NumberFormat('es-CO',{style:'currency',currency:cur}).format(r.subtotal)}\nIVA: ${new Intl.NumberFormat('es-CO',{style:'currency',currency:cur}).format(r.taxVal)}\nMargen: ${new Intl.NumberFormat('es-CO',{style:'currency',currency:cur}).format(r.marginVal)}\nPrecio unitario: ${new Intl.NumberFormat('es-CO',{style:'currency',currency:cur}).format(r.unitPrice)}\nTotal: ${new Intl.NumberFormat('es-CO',{style:'currency',currency:cur}).format(r.totalPrice)}`;
  navigator.clipboard?.writeText(txt).then(()=>alert('Cotización copiada al portapapeles'));
});

$('export').addEventListener('click', ()=>{
  const r = calculate();
  const cur = r.currency;
  const content = `Cotización - ${r.part}\nCantidad: ${r.quantity}\nPeso estimado: ${r.weightGr} g\nCosto material: ${new Intl.NumberFormat('es-CO',{style:'currency',currency:cur}).format(r.materialCost)}\nCosto máquina: ${new Intl.NumberFormat('es-CO',{style:'currency',currency:cur}).format(r.machineCost)}\nMano de obra: ${new Intl.NumberFormat('es-CO',{style:'currency',currency:cur}).format(r.finishing)}\nSubtotal: ${new Intl.NumberFormat('es-CO',{style:'currency',currency:cur}).format(r.subtotal)}\nIVA: ${new Intl.NumberFormat('es-CO',{style:'currency',currency:cur}).format(r.taxVal)}\nMargen: ${new Intl.NumberFormat('es-CO',{style:'currency',currency:cur}).format(r.marginVal)}\nPrecio unitario: ${new Intl.NumberFormat('es-CO',{style:'currency',currency:cur}).format(r.unitPrice)}\nTotal: ${new Intl.NumberFormat('es-CO',{style:'currency',currency:cur}).format(r.totalPrice)}`;
  const blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${r.part.replace(/\s+/g,'_')}_cotizacion.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});