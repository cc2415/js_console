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

    // 创建表头名称到索引的映射
    const headerMap = {};
    const headers = Array.from(headerRow.querySelectorAll('th, td')).map((h, index) => {
        const name = h.textContent.trim();
        headerMap[name] = index;
        return name;
    });

    if (headers.length === 0) {
        console.error('❌ 错误：找不到任何表头单元格。');
        return;
    }

    console.log('--- 📋 可用表头及对应列索引 ---');
    headers.forEach((header, index) => {
        console.log(`[${index}] ${header}`);
    });
    console.log('---------------------------');
    
    // --- 2. 提示用户输入数据行容器选择器并全局查找 (同上版本) ---
    const rowContainerSelector = prompt("📝 请输入数据行容器的**全局**选择器 (例如: 'tbody[tabindex=\"-1\"]' 或 'div.data-rows'):", "tbody[tabindex=\"-1\"]");
    
    if (!rowContainerSelector) {
        console.log('✅ 已取消导出操作。');
        return;
    }
    
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
        console.log(`--- 找到 ${containers.length} 个匹配的容器，请选择序号 ---`);
        containers.forEach((container, index) => {
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

    // --- 3. 提示用户输入列名称，并将其转换为索引 (同上版本) ---
    const columnsNameInput = prompt(`📝 请输入您想导出的**列名称** (用逗号 ',' 分隔，例如: '${headers.slice(0, 2).join(',')}'):`);

    if (!columnsNameInput) {
        console.log('✅ 已取消导出操作。');
        return;
    }

    const requiredColumns = []; // 存储 {name: string, index: number}
    const missingHeaders = [];  // 存储未找到的名称

    columnsNameInput.split(',').map(name => name.trim()).filter(name => name).forEach(name => {
        if (headerMap.hasOwnProperty(name)) {
            requiredColumns.push({ name: name, index: headerMap[name] });
        } else {
            missingHeaders.push(name);
        }
    });

    if (requiredColumns.length === 0) {
        console.error('❌ 错误：您输入的列名称与表格中的任何列名称都不匹配。');
        return;
    }
    
    if (missingHeaders.length > 0) {
        console.warn(`⚠️ 警告：找不到以下列名称，已跳过：${missingHeaders.join(', ')}`);
    }

    // --- 4. 提取数据 ---
    const data = [];
    const dataRows = Array.from(selectedContainer.querySelectorAll('tr'));
    
    dataRows.forEach(row => {
        const rowData = {};
        const cells = Array.from(row.querySelectorAll('td, th')); 

        requiredColumns.forEach(col => {
            const cellValue = cells[col.index] ? cells[col.index].textContent.trim() : null;
            rowData[col.name] = cellValue;
        });

        if (Object.keys(rowData).length === requiredColumns.length) {
             data.push(rowData);
        }
    });

    if (data.length === 0) {
        console.log('⚠️ 警告: 未提取到任何数据行。');
        return;
    }

    // --- 5. 提示用户选择导出格式并执行导出 ---
    const exportFormat = prompt("📁 请选择导出格式 (输入 'json' 或 'csv'):", "json").toLowerCase();

    const columnNames = requiredColumns.map(c => c.name);
    const fileName = `ExportedData_${new Date().toISOString().slice(0, 10)}`;

    if (exportFormat === 'csv') {
        
        // CSV 导出逻辑
        const csvRows = [];
        
        // 1. CSV Header Row
        // 确保字段中的双引号被转义，并且如果有逗号，整个字段用双引号包裹
        const escapeCsvField = (field) => {
            if (field === null) return '';
            const str = String(field).replace(/"/g, '""');
            if (str.includes(',') || str.includes('\n')) {
                return `"${str}"`;
            }
            return str;
        };
        
        csvRows.push(columnNames.map(escapeCsvField).join(','));

        // 2. CSV Data Rows
        data.forEach(item => {
            const row = columnNames.map(name => escapeCsvField(item[name])).join(',');
            csvRows.push(row);
        });

        const csvString = '\uFEFF' + csvRows.join('\n'); // 添加 BOM 头，确保 Excel 正确识别中文编码

        // 创建下载链接并触发下载
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`--- ✅ 数据导出成功 (CSV) ---`);
        console.log(`文件 '${fileName}.csv' 已尝试下载。`);

    } else { // 默认为 JSON 导出
        
        const jsonOutput = JSON.stringify(data, null, 2);

        // JSON 导出逻辑 (输出到控制台)
        console.log('--- ✅ 数据导出成功 (JSON) ---');
        console.log(`总共导出 ${data.length} 行数据。`);
        console.log(jsonOutput);
        console.log('---------------------------');
    }
    
    console.log(`导出的列名称: ${columnNames.join(', ')}`);
    // 返回结果，方便在控制台中直接复制 JSON
    return data;
})();
