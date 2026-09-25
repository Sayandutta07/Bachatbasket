const db = require('./db');

function optimizeBasket(basketItems = []) {
    if (!basketItems || basketItems.length === 0) {
        return {
            itemsCount: 0,
            singleApp: null,
            allSingleApps: [],
            splitPlan: null,
            savingsVsBestSingle: 0,
            savingsVsWorstSingle: 0,
            tips: []
        };
    }

    const platformsRaw = db.prepare('SELECT * FROM platforms WHERE active = 1').all();
    const platforms = {};
    platformsRaw.forEach(p => {
        platforms[p.id] = {
            id: p.id,
            name: p.name,
            color: p.color,
            deliveryTime: p.delivery_time,
            deliveryFee: p.delivery_fee,
            handlingFee: p.handling_fee,
            freeThreshold: p.free_threshold,
            logoSvg: p.logo_svg
        };
    });

    const platformIds = Object.keys(platforms);

    const resolvedItems = [];
    const productIds = basketItems.filter(i => !i.isCustom && i.id).map(i => i.id);

    let productMap = {};
    if (productIds.length > 0) {
        const placeholders = productIds.map(() => '?').join(',');
        const prods = db.prepare(`SELECT * FROM products WHERE id IN (${placeholders})`).all(...productIds);
        prods.forEach(p => {
            productMap[p.id] = {
                ...p,
                prices: JSON.parse(p.prices),
                alternatives: JSON.parse(p.alternatives)
            };
        });
    }

    for (const item of basketItems) {
        const qty = Math.max(1, parseInt(item.qty) || 1);
        if (item.isCustom) {
            const price = parseFloat(item.price) || 30;
            const prices = {};
            platformIds.forEach(pId => {
                prices[pId] = { price: price, available: true };
            });
            resolvedItems.push({
                id: item.id || `custom_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                name: item.name || 'Custom Item',
                brand: item.brand || 'Quick Add-on',
                unit: item.unit || '1 Pack',
                isCustom: true,
                qty: qty,
                prices: prices
            });
        } else {
            const prod = productMap[item.id];
            if (prod) {
                resolvedItems.push({
                    id: prod.id,
                    name: prod.name,
                    brand: prod.brand,
                    category: prod.category,
                    unit: prod.unit,
                    img: prod.img,
                    isCustom: false,
                    qty: qty,
                    prices: prod.prices
                });
            } else {
                const fallbackPrice = parseFloat(item.price) || 50;
                const prices = {};
                platformIds.forEach(pId => {
                    prices[pId] = { price: fallbackPrice, available: true };
                });
                resolvedItems.push({
                    id: item.id,
                    name: item.name || 'Grocery Item',
                    brand: 'Generic',
                    unit: '1 Unit',
                    isCustom: true,
                    qty: qty,
                    prices: prices
                });
            }
        }
    }

    const singleAppResults = [];
    platformIds.forEach(pId => {
        const pConfig = platforms[pId];
        let subtotal = 0;
        let allAvailable = true;
        const itemBreakdown = [];

        for (const item of resolvedItems) {
            const pInfo = item.prices[pId];
            if (!pInfo || !pInfo.available) {
                allAvailable = false;
            }
            const unitPrice = pInfo ? pInfo.price : 9999;
            const itemTotal = unitPrice * item.qty;
            subtotal += itemTotal;
            itemBreakdown.push({
                id: item.id,
                name: item.name,
                unitPrice: unitPrice,
                qty: item.qty,
                total: itemTotal
            });
        }

        const delivery = subtotal >= pConfig.freeThreshold ? 0 : pConfig.deliveryFee;
        const grandTotal = subtotal + delivery + pConfig.handlingFee;
        const freeDeliveryGap = Math.max(0, pConfig.freeThreshold - subtotal);

        singleAppResults.push({
            platform: pId,
            platformName: pConfig.name,
            color: pConfig.color,
            deliveryTime: pConfig.deliveryTime,
            subtotal: subtotal,
            deliveryFee: delivery,
            handlingFee: pConfig.handlingFee,
            grandTotal: grandTotal,
            freeThreshold: pConfig.freeThreshold,
            freeDeliveryGap: freeDeliveryGap,
            allAvailable: allAvailable,
            itemBreakdown: itemBreakdown
        });
    });

    singleAppResults.sort((a, b) => a.grandTotal - b.grandTotal);
    const bestSingle = singleAppResults[0];
    const worstSingle = singleAppResults[singleAppResults.length - 1];

    let itemCheapestAssignments = resolvedItems.map(item => {
        let minPrice = Infinity;
        let bestPlatform = platformIds[0];
        platformIds.forEach(pId => {
            const pInfo = item.prices[pId];
            if (pInfo && pInfo.available && pInfo.price < minPrice) {
                minPrice = pInfo.price;
                bestPlatform = pId;
            }
        });
        return {
            item,
            platform: bestPlatform,
            unitPrice: minPrice,
            total: minPrice * item.qty
        };
    });

    function calculateOrderForAssignments(assignments) {
        const groups = {};
        for (const assign of assignments) {
            if (!groups[assign.platform]) {
                groups[assign.platform] = {
                    platform: assign.platform,
                    items: [],
                    subtotal: 0
                };
            }
            groups[assign.platform].items.push(assign);
            groups[assign.platform].subtotal += assign.total;
        }

        let combinedGrandTotal = 0;
        let combinedDelivery = 0;
        let combinedHandling = 0;
        let combinedSubtotal = 0;
        const platformOrders = [];

        for (const pId of Object.keys(groups)) {
            const grp = groups[pId];
            const pConfig = platforms[pId];
            const delivery = grp.subtotal >= pConfig.freeThreshold ? 0 : pConfig.deliveryFee;
            const grandTotal = grp.subtotal + delivery + pConfig.handlingFee;

            combinedSubtotal += grp.subtotal;
            combinedDelivery += delivery;
            combinedHandling += pConfig.handlingFee;
            combinedGrandTotal += grandTotal;

            platformOrders.push({
                platform: pId,
                platformName: pConfig.name,
                deliveryTime: pConfig.deliveryTime,
                color: pConfig.color,
                subtotal: grp.subtotal,
                deliveryFee: delivery,
                handlingFee: pConfig.handlingFee,
                freeThreshold: pConfig.freeThreshold,
                grandTotal: grandTotal,
                items: grp.items.map(i => ({
                    id: i.item.id,
                    name: i.item.name,
                    qty: i.item.qty,
                    unitPrice: i.unitPrice,
                    total: i.total
                }))
            });
        }

        return {
            combinedGrandTotal,
            combinedSubtotal,
            combinedDelivery,
            combinedHandling,
            platformOrders
        };
    }

    let optimalSplit = calculateOrderForAssignments(itemCheapestAssignments);

    for (let i = 0; i < platformIds.length; i++) {
        for (let j = i + 1; j < platformIds.length; j++) {
            const p1 = platformIds[i];
            const p2 = platformIds[j];

            const pairAssignments = resolvedItems.map(item => {
                const price1 = (item.prices[p1] && item.prices[p1].available) ? item.prices[p1].price : Infinity;
                const price2 = (item.prices[p2] && item.prices[p2].available) ? item.prices[p2].price : Infinity;
                const chosenPlatform = price1 <= price2 ? p1 : p2;
                const unitPrice = Math.min(price1, price2);
                return {
                    item,
                    platform: chosenPlatform,
                    unitPrice: unitPrice,
                    total: unitPrice * item.qty
                };
            });

            const pairResult = calculateOrderForAssignments(pairAssignments);
            if (pairResult.combinedGrandTotal < optimalSplit.combinedGrandTotal) {
                optimalSplit = pairResult;
            }
        }
    }

    const splitSavingsVsBestSingle = bestSingle ? (bestSingle.grandTotal - optimalSplit.combinedGrandTotal) : 0;
    const isSplitRecommended = splitSavingsVsBestSingle > 0 && optimalSplit.platformOrders.length > 1;

    const tips = [];
    if (bestSingle && bestSingle.freeDeliveryGap > 0 && bestSingle.freeDeliveryGap <= 60) {
        tips.push({
            type: 'delivery_unlock',
            platform: bestSingle.platform,
            message: `Add ₹${bestSingle.freeDeliveryGap} more on ${bestSingle.platform} to unlock FREE Delivery and save ₹${bestSingle.deliveryFee}!`
        });
    }

    if (isSplitRecommended) {
        tips.push({
            type: 'split_win',
            message: `Smart Split saves ₹${splitSavingsVsBestSingle} extra across ${optimalSplit.platformOrders.length} apps instead of ordering everything from one place!`
        });
    } else if (bestSingle) {
        tips.push({
            type: 'single_win',
            message: `Consolidating your entire order on ${bestSingle.platform} gives the cheapest total (₹${bestSingle.grandTotal}) because multi-store delivery fees outweigh split item discounts.`
        });
    }

    return {
        itemsCount: resolvedItems.reduce((acc, curr) => acc + curr.qty, 0),
        items: resolvedItems,
        singleApp: bestSingle,
        allSingleApps: singleAppResults,
        splitPlan: {
            isSplitRecommended: isSplitRecommended,
            combinedTotal: optimalSplit.combinedGrandTotal,
            combinedSubtotal: optimalSplit.combinedSubtotal,
            combinedDelivery: optimalSplit.combinedDelivery,
            combinedHandling: optimalSplit.combinedHandling,
            savingsVsBestSingle: Math.max(0, splitSavingsVsBestSingle),
            orders: optimalSplit.platformOrders
        },
        savingsVsBestSingle: Math.max(0, splitSavingsVsBestSingle),
        savingsVsWorstSingle: worstSingle ? (worstSingle.grandTotal - (isSplitRecommended ? optimalSplit.combinedGrandTotal : bestSingle.grandTotal)) : 0,
        tips: tips
    };
}

module.exports = { optimizeBasket };
