(function() {
    // --- 1. 获取表格和表头信息 ---
    const tableSelector = prompt("📝 请输入表格的选择器 (例如: 'table' 或 '#myTableId'，留空默认为第一个 'table'):", "table");
    const table = document.querySelector(tableSelector || 'table');

    if (!table) {
        console.error(`❌ 错误：找不到选择器为 "${tableSelector || 'table'}" 的表格元素。`);
        return;
    }

    const headerRow = table.querySelector('thead tr') || table.querySelector('tbody tr');
    
    if (!headerRow) {
        console.error('❌ 错误：找不到表格的行或标题行。');
        return;
    }

    const headers = Array.from(headerRow.querySelectorAll('th, td')).map(h => h.textContent.trim());

    if (headers.length === 0) {
        console.error('❌ 错误：找不到任何表头单元格。');
        return;
    }

    console.log('--- 📋 表头及对应列索引 ---');
    headers.forEach((header, index) => {
        console.log(`[${index}] ${header}`);
    });
    console.log('---------------------------');
    
    // --- 2. 提示用户输入数据行容器选择器并全局查找 ---
    const rowContainerSelector = prompt("📝 请输入数据行容器的**全局**选择器 (例如: 'tbody[tabindex=\"-1\"]' 或 'div.data-rows'):", "tbody[tabindex=\"-1\"]");
    
    if (!rowContainerSelector) {
        console.log('✅ 已取消导出操作。');
        return;
    }
    
    // 全局查找所有匹配的容器
    const containers = Array.from(document.querySelectorAll(rowContainerSelector));

    if (containers.length === 0) {
        console.error(`❌ 错误：在整个页面上找不到选择器为 "${rowContainerSelector}" 的数据行容器。`);
        return;
    }

    let selectedContainer;
    if (containers.length === 1) {
        selectedContainer = containers[0];
        console.log(`✅ 自动选中唯一的匹配容器: ${rowContainerSelector}`);
    } else {
        // 找到多个容器，让用户选择
        console.log(`--- 找到 ${containers.length} 个匹配的容器，请选择序号 ---`);
        containers.forEach((container, index) => {
            // 尽量展示容器的上下文信息，例如父级 ID/类名
            const parentContext = container.parentElement ? 
                ` (父级: ${container.parentElement.id ? '#' + container.parentElement.id : container.parentElement.className ? '.' + container.parentElement.className : container.parentElement.tagName})` : '';
            console.log(`[${index}]: <${container.tagName}>${parentContext}`);
        });
        console.log('----------------------------------------------------');

        const choiceInput = prompt(`📢 请输入您想导出的容器的**序号** (0 到 ${containers.length - 1}):`);
        const choice = parseInt(choiceInput, 10);

        if (isNaN(choice) || choice < 0 || choice >= containers.length) {
            console.error('❌ 错误：无效的序号选择。');
            return;
        }
        selectedContainer = containers[choice];
        console.log(`✅ 已选择序号 ${choice} 的容器。`);
    }

    // --- 3. 提示用户输入列索引 ---
    const columnsInput = prompt("📝 请输入您想导出的列的**索引** (用逗号 ',' 分隔，例如: '0,2,3'):");

    if (!columnsInput) {
        console.log('✅ 已取消导出操作。');
        return;
    }

    const requiredIndices = columnsInput.split(',')
        .map(i => parseInt(i.trim(), 10))
        .filter(i => !isNaN(i) && i >= 0 && i < headers.length);

    if (requiredIndices.length === 0) {
        console.error('❌ 错误：请输入有效的列索引。');
        return;
    }

    // --- 4. 提取数据 ---
    const data = [];
    
    // 从选中的容器内查找所有行
    const dataRows = Array.from(selectedContainer.querySelectorAll('tr'));
    
    dataRows.forEach(row => {
        const rowData = {};
        const cells = Array.from(row.querySelectorAll('td, th')); 

        requiredIndices.forEach(index => {
            const header = headers[index]; // 使用表头作为 JSON 键名
            
            if (cells[index]) {
                rowData[header] = cells[index].textContent.trim();
            } else {
                rowData[header] = null; 
            }
        });

        // 只有当行提取到了所需数量的数据才加入结果集
        if (Object.keys(rowData).length === requiredIndices.length) {
             data.push(rowData);
        }
    });

    // --- 5. 输出 JSON 结果 ---
    const jsonOutput = JSON.stringify(data, null, 2);

    console.log('--- ✅ 数据导出成功 ---');
    console.log(`选择的列索引: ${requiredIndices.join(', ')}`);
    console.log(`总共导出 ${data.length} 行数据。`);
    console.log(jsonOutput);
    console.log('---------------------------');
    
    return jsonOutput;
})();
