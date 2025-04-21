// 文件: app.js
const { useState, useEffect } = React;

// 本地存储键名
const WARDROBE_STORAGE_KEY = 'my-wardrobe-data';

const WardrobeApp = () => {
  // 初始默认衣橱数据
  const defaultWardrobe = {
    innerWear: ['吊带', '白吊带',],
    shortSleeve: ['白U领'],
    longSleeve: ['安踏Polo'],
    thickLongSleeve: ['黑白条纹'],
    shirt: ['乐町白'],
    jacket: ['牛仔', ],
    thickJacket: [ '深灰大衣'],
    pants: ['军绿工装'],
    skirt: ['牛仔蓝'],
    dress: ['黑棉麻连衣裙']
  };

  // 状态管理
  const [wardrobe, setWardrobe] = useState(defaultWardrobe);
  const [categoryOrder, setCategoryOrder] = useState(Object.keys(defaultWardrobe));
  const [outfits, setOutfits] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('outfits'); 
  const [editCategory, setEditCategory] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [itemToRemove, setItemToRemove] = useState({ category: '', item: '' });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categoryType, setCategoryType] = useState('');

  // 新增: 搭配选择
  const [outfitSelections, setOutfitSelections] = useState({
    outerLayer: {
      jacket: "any", // "any", "none", or specific item
      thickJacket: "any"
    },
    innerLayer: {
      innerWear: "any",
      shortSleeve: "any",
      longSleeve: "any",
      thickLongSleeve: "any",
      shirt: "any"
    },
    bottomLayer: {
      pants: "any",
      skirt: "any"
    }
  });

  const outfitsPerPage = 5;

  // 从本地存储加载数据
  useEffect(() => {
    const savedData = localStorage.getItem(WARDROBE_STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData.wardrobe) setWardrobe(parsedData.wardrobe);
        if (parsedData.categoryOrder) setCategoryOrder(parsedData.categoryOrder);
        
        // 初始化搭配选择状态，确保包含所有类别
        const newOuterLayer = {...outfitSelections.outerLayer};
        const newInnerLayer = {...outfitSelections.innerLayer};
        const newBottomLayer = {...outfitSelections.bottomLayer};
        
        // 分类每个类别到对应的层
        Object.keys(parsedData.wardrobe).forEach(category => {
          if (category === 'jacket' || category === 'thickJacket' || category.includes('Jacket')) {
            if (!newOuterLayer[category]) newOuterLayer[category] = "any";
          } else if (category === 'pants' || category === 'skirt' || category.includes('pants') || category.includes('skirt')) {
            if (!newBottomLayer[category]) newBottomLayer[category] = "any";
          } else if (category !== 'dress') { // 连衣裙不参与搭配
            if (!newInnerLayer[category]) newInnerLayer[category] = "any";
          }
        });
        
        // 更新搭配选择状态
        setOutfitSelections({
          outerLayer: newOuterLayer,
          innerLayer: newInnerLayer,
          bottomLayer: newBottomLayer
        });
      } catch (e) {
        console.error('Failed to load wardrobe data:', e);
      }
    }
  }, []);

  // 保存到本地存储
  useEffect(() => {
    localStorage.setItem(WARDROBE_STORAGE_KEY, JSON.stringify({
      wardrobe,
      categoryOrder
    }));
  }, [wardrobe, categoryOrder]);

  // 生成所有可行的搭配组合
  const generateOutfits = () => {
    const allOutfits = [];
    
    // 获取选中的外层选项
    const outerOptions = [];
    Object.entries(outfitSelections.outerLayer).forEach(([category, selection]) => {
      if (selection === "none") return; // 如果选择不使用该类别，跳过
      
      if (selection === "any") {
        // 如果是"任选"，添加该类别的所有项目
        if (wardrobe[category]) {
          wardrobe[category].forEach(item => {
            outerOptions.push({ type: category, item });
          });
        }
      } else {
        // 如果是特定项目，只添加该项目
        outerOptions.push({ type: category, item: selection });
      }
    });
    
    // 如果没有选择任何外层，添加一个空选项表示不使用外套
    if (outerOptions.length === 0) {
      outerOptions.push({ type: 'none', item: null });
    }
    
    // 获取选中的内层选项
    const innerOptions = [];
    Object.entries(outfitSelections.innerLayer).forEach(([category, selection]) => {
      if (selection === "none") return; // 如果选择不使用该类别，跳过
      
      if (selection === "any") {
        // 如果是"任选"，添加该类别的所有项目
        if (wardrobe[category]) {
          wardrobe[category].forEach(item => {
            innerOptions.push({ type: category, item });
          });
        }
      } else {
        // 如果是特定项目，只添加该项目
        innerOptions.push({ type: category, item: selection });
      }
    });
    
    // 内层必须有选择，否则无法形成搭配
    if (innerOptions.length === 0) {
      setOutfits([]);
      return;
    }
    
    // 获取选中的底层选项
    const bottomOptions = [];
    Object.entries(outfitSelections.bottomLayer).forEach(([category, selection]) => {
      if (selection === "none") return; // 如果选择不使用该类别，跳过
      
      if (selection === "any") {
        // 如果是"任选"，添加该类别的所有项目
        if (wardrobe[category]) {
          wardrobe[category].forEach(item => {
            bottomOptions.push({ type: category, item });
          });
        }
      } else {
        // 如果是特定项目，只添加该项目
        bottomOptions.push({ type: category, item: selection });
      }
    });
    
    // 底层必须有选择，否则无法形成搭配
    if (bottomOptions.length === 0) {
      setOutfits([]);
      return;
    }
    
    // 生成所有可能的搭配组合
    outerOptions.forEach(outer => {
      innerOptions.forEach(inner => {
        bottomOptions.forEach(bottom => {
          // 创建搭配
          const outfit = {
            outer: outer.type === 'none' ? null : outer,
            inner,
            bottom
          };
          
          // 添加到搭配列表
          allOutfits.push(outfit);
        });
      });
    });
    
    setOutfits(allOutfits);
    setCurrentPage(1); // 重置分页到第一页
  };

  // 新增衣物项目
  const addItem = (category) => {
    if (!newItemName.trim()) return;
    
    setWardrobe(prev => ({
      ...prev,
      [category]: [...(prev[category] || []), newItemName.trim()]
    }));
    
    setNewItemName('');
    setEditCategory(null);
  };

  // 移除衣物项目
  const removeItem = (category, item) => {
    setItemToRemove({ category, item });
  };

  // 确认移除
  const confirmRemove = () => {
    const { category, item } = itemToRemove;
    
    setWardrobe(prev => ({
      ...prev,
      [category]: prev[category].filter(i => i !== item)
    }));
    
    setItemToRemove({ category: '', item: '' });
  };

  // 添加新类别
  const addCategory = () => {
    if (!newCategoryName.trim() || !categoryType) return;
    
    // 创建新类别
    setWardrobe(prev => ({
      ...prev,
      [newCategoryName.trim()]: []
    }));
    
    // 更新类别顺序
    setCategoryOrder(prev => [...prev, newCategoryName.trim()]);
    
    // 更新搭配选择状态，将新类别添加到对应的层
    setOutfitSelections(prev => {
      const updated = {...prev};
      if (categoryType === 'outer') {
        updated.outerLayer[newCategoryName.trim()] = "any";
      } else if (categoryType === 'inner') {
        updated.innerLayer[newCategoryName.trim()] = "any";
      } else if (categoryType === 'bottom') {
        updated.bottomLayer[newCategoryName.trim()] = "any";
      }
      return updated;
    });
    
    setNewCategoryName('');
    setCategoryType('');
    setShowAddCategory(false);
  };

  // 删除类别
  const removeCategory = (category) => {
    // 从衣橱数据中删除
    setWardrobe(prev => {
      const updated = {...prev};
      delete updated[category];
      return updated;
    });
    
    // 从类别顺序中删除
    setCategoryOrder(prev => prev.filter(c => c !== category));
    
    // 从搭配选择状态中删除
    setOutfitSelections(prev => {
      const updated = {...prev};
      if (updated.outerLayer[category]) delete updated.outerLayer[category];
      if (updated.innerLayer[category]) delete updated.innerLayer[category];
      if (updated.bottomLayer[category]) delete updated.bottomLayer[category];
      return updated;
    });
  };

  // 获取分类名称
  const getCategoryName = (category) => {
    const nameMap = {
      innerWear: '内搭',
      shortSleeve: '短袖',
      longSleeve: '长袖',
      thickLongSleeve: '厚长袖',
      shirt: '衬衫',
      jacket: '外套',
      thickJacket: '厚外套',
      pants: '裤子',
      skirt: '半身裙',
      dress: '连衣裙'
    };
    return nameMap[category] || category;
  };

  // 获取类别所属层
  const getCategoryLayer = (category) => {
    if (outfitSelections.outerLayer[category] !== undefined) return 'outer';
    if (outfitSelections.innerLayer[category] !== undefined) return 'inner';
    if (outfitSelections.bottomLayer[category] !== undefined) return 'bottom';
    if (category === 'dress') return 'special'; // 连衣裙特殊处理
    
    // 根据类别名称推断
    if (category.includes('jacket') || category.includes('Jacket')) return 'outer';
    if (category.includes('pants') || category.includes('skirt') || category.includes('Pants') || category.includes('Skirt')) return 'bottom';
    return 'inner'; // 默认归为内层
  };

  // 处理搭配选择变更
  const handleOutfitSelectionChange = (layer, category, value) => {
    setOutfitSelections(prev => {
      const updated = {...prev};
      if (layer === 'outer') {
        updated.outerLayer = {...updated.outerLayer, [category]: value};
      } else if (layer === 'inner') {
        updated.innerLayer = {...updated.innerLayer, [category]: value};
      } else if (layer === 'bottom') {
        updated.bottomLayer = {...updated.bottomLayer, [category]: value};
      }
      return updated;
    });
  };

  // 渲染编辑分类界面
  const renderEditCategory = () => {
    if (!editCategory) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-10">
        <div className="bg-white rounded-lg p-4 w-full max-w-md">
          <h3 className="font-bold text-lg mb-4">编辑{getCategoryName(editCategory)}</h3>
          
          <div className="mb-4">
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={`添加新的${getCategoryName(editCategory)}`}
                className="flex-1 p-2 border rounded"
              />
              <button 
                onClick={() => addItem(editCategory)}
                className="bg-green-500 text-white px-3 py-1 rounded"
              >
                添加
              </button>
            </div>
          </div>
          
          <div className="mb-4 max-h-60 overflow-auto">
            <h4 className="font-medium mb-2">现有项目：</h4>
            {wardrobe[editCategory] && wardrobe[editCategory].length > 0 ? (
              <div className="space-y-2">
                {wardrobe[editCategory].map(item => (
                  <div key={item} className="flex justify-between items-center p-2 border rounded">
                    <span>{item}</span>
                    <button 
                      onClick={() => removeItem(editCategory, item)}
                      className="text-red-500"
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-2">暂无项目</p>
            )}
          </div>
          
          <div className="flex justify-between">
            {editCategory !== 'innerWear' && 
             editCategory !== 'shortSleeve' && 
             editCategory !== 'longSleeve' && 
             editCategory !== 'thickLongSleeve' && 
             editCategory !== 'shirt' && 
             editCategory !== 'jacket' && 
             editCategory !== 'thickJacket' && 
             editCategory !== 'pants' && 
             editCategory !== 'skirt' && 
             editCategory !== 'dress' && (
              <button 
                onClick={() => {
                  if (confirm(`确定要删除"${getCategoryName(editCategory)}"类别吗？`)) {
                    removeCategory(editCategory);
                    setEditCategory(null);
                  }
                }}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                删除类别
              </button>
            )}
            <button 
              onClick={() => setEditCategory(null)}
              className="bg-blue-500 text-white px-4 py-2 rounded ml-auto"
            >
              完成
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 显示添加类别界面
  const renderAddCategory = () => {
    if (!showAddCategory) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-10">
        <div className="bg-white rounded-lg p-4 w-full max-w-md">
          <h3 className="font-bold text-lg mb-4">添加新类别</h3>
          
          <div className="mb-4">
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">类别所属层:</label>
              <select
                className="w-full p-2 border rounded"
                value={categoryType}
                onChange={(e) => setCategoryType(e.target.value)}
              >
                <option value="">请选择类别所属层</option>
                <option value="outer">外层（外套）</option>
                <option value="inner">内层（上衣）</option>
                <option value="bottom">底层（下装）</option>
                <option value="special">特殊（连衣裙）</option>
              </select>
            </div>
            
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="输入新类别名称"
                className="flex-1 p-2 border rounded"
              />
              <button 
                onClick={addCategory}
                disabled={!categoryType}
                className={`${categoryType ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'} px-3 py-1 rounded`}
              >
                添加
              </button>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button 
              onClick={() => {
                setShowAddCategory(false);
                setNewCategoryName('');
                setCategoryType('');
              }}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 确认删除弹窗
  const renderConfirmRemove = () => {
    if (!itemToRemove.item) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-20">
        <div className="bg-white rounded-lg p-4 w-full max-w-md">
          <h3 className="font-bold text-lg mb-4">确认删除</h3>
          <p className="mb-4">您确定要删除"{itemToRemove.item}"吗？</p>
          
          <div className="flex justify-end space-x-2">
            <button 
              onClick={() => setItemToRemove({ category: '', item: '' })}
              className="bg-gray-300 px-4 py-2 rounded"
            >
              取消
            </button>
            <button 
              onClick={confirmRemove}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 渲染搭配选择器
  const renderOutfitSelectors = () => {
    return (
      <div className="space-y-4">
        {/* 外层选择器 */}
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <h3 className="font-medium mb-3">外层（外套）</h3>
          {Object.keys(outfitSelections.outerLayer).map(category => (
            <div key={category} className="mb-2">
              <label className="block text-sm font-medium mb-1">{getCategoryName(category)}:</label>
              <select
                className="w-full p-2 border rounded"
                value={outfitSelections.outerLayer[category]}
                onChange={(e) => handleOutfitSelectionChange('outer', category, e.target.value)}
              >
                <option value="any">任选</option>
                <option value="none">不选择该类别</option>
                {wardrobe[category] && wardrobe[category].map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
        
        {/* 内层选择器 */}
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <h3 className="font-medium mb-3">内层（上衣）</h3>
          {Object.keys(outfitSelections.innerLayer).map(category => (
            <div key={category} className="mb-2">
              <label className="block text-sm font-medium mb-1">{getCategoryName(category)}:</label>
              <select
                className="w-full p-2 border rounded"
                value={outfitSelections.innerLayer[category]}
                onChange={(e) => handleOutfitSelectionChange('inner', category, e.target.value)}
              >
                <option value="any">任选</option>
                <option value="none">不选择该类别</option>
                {wardrobe[category] && wardrobe[category].map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
        
        {/* 底层选择器 */}
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <h3 className="font-medium mb-3">底层（下装）</h3>
          {Object.keys(outfitSelections.bottomLayer).map(category => (
            <div key={category} className="mb-2">
              <label className="block text-sm font-medium mb-1">{getCategoryName(category)}:</label>
              <select
                className="w-full p-2 border rounded"
                value={outfitSelections.bottomLayer[category]}
                onChange={(e) => handleOutfitSelectionChange('bottom', category, e.target.value)}
              >
                <option value="any">任选</option>
                <option value="none">不选择该类别</option>
                {wardrobe[category] && wardrobe[category].map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
        
        {/* 生成搭配按钮 */}
        <button
          onClick={generateOutfits}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium"
        >
          生成搭配
        </button>
      </div>
    );
  };

  // 渲染搭配组合
  const renderOutfit = (outfit, index) => {
    return (
      <div key={index} className="p-3 bg-white rounded-lg shadow-sm">
        <h3 className="font-medium text-sm text-gray-500 mb-1">
          搭配 #{indexOfFirstOutfit + index + 1}
        </h3>
        <div className="flex items-center">
          <div className="flex-1">
            {/* 外层 */}
            {outfit.outer && (
              <p className="mb-1">
                <span className="text-gray-600">外层:</span>{' '}
                {outfit.outer.item}({getCategoryName(outfit.outer.type)})
              </p>
            )}
            
            {/* 内层 */}
            <p className="mb-1">
              <span className="text-gray-600">内层:</span>{' '}
              {outfit.inner.item}({getCategoryName(outfit.inner.type)})
            </p>
            
            {/* 底层 */}
            <p>
              <span className="text-gray-600">底层:</span>{' '}
              {outfit.bottom.item}({getCategoryName(outfit.bottom.type)})
            </p>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-xs text-gray-500">搭配</span>
          </div>
        </div>
      </div>
    );
  };

  // 分页数据
  const indexOfLastOutfit = currentPage * outfitsPerPage;
  const indexOfFirstOutfit = indexOfLastOutfit - outfitsPerPage;
  const currentOutfits = outfits.slice(indexOfFirstOutfit, indexOfLastOutfit);
  const totalPages = Math.ceil(outfits.length / outfitsPerPage);

  return (
    <div className="max-w-md mx-auto bg-gray-100 min-h-screen">
      <header className="bg-blue-500 text-white p-4">
        <h1 className="text-xl font-bold text-center">我的电子衣橱</h1>
      </header>
      
      {/* 标签页切换 */}
      <div className="flex border-b">
        <button 
          className={`flex-1 py-3 ${activeTab === 'outfits' ? 'bg-white text-blue-500 border-b-2 border-blue-500' : 'bg-gray-100'}`}
          onClick={() => setActiveTab('outfits')}
        >
          搭配查看
        </button>
        <button 
          className={`flex-1 py-3 ${activeTab === 'edit' ? 'bg-white text-blue-500 border-b-2 border-blue-500' : 'bg-gray-100'}`}
          onClick={() => setActiveTab('edit')}
        >
          衣物管理
        </button>
      </div>
      
      {activeTab === 'outfits' ? (
        <div className="p-4">
          {/* 搭配选择器 */}
          <div className="mb-4">
            {renderOutfitSelectors()}
          </div>
          
          {/* 搭配结果 */}
          <div className="mb-4">
            <h2 className="text-lg font-medium mb-2">
              搭配结果 ({outfits.length}个)
            </h2>
            
            {outfits.length === 0 ? (
              <p className="text-center py-4 bg-gray-50 rounded">点击"生成搭配"按钮生成搭配方案</p>
            ) : (
              <div className="space-y-3">
                {currentOutfits.map((outfit, index) => renderOutfit(outfit, index))}
              </div>
            )}
          </div>
          
          {/* 分页 */}
          {outfits.length > 0 && (
            <div className="flex justify-between items-center">
              <button 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-200 text-gray-500' : 'bg-blue-500 text-white'}`}
              >
                上一页
              </button>
              
              <span className="text-sm">
                {currentPage} / {totalPages}
              </span>
              
              <button 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-200 text-gray-500' : 'bg-blue-500 text-white'}`}
              >
                下一页
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">衣物管理</h2>
            <button 
              onClick={() => setShowAddCategory(true)}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm"
            >
              添加类别
            </button>
          </div>
          
          {/* 搭配规则提示 */}
          <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm">
            <h3 className="font-medium mb-1">搭配规则说明</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>搭配分为三个模块：外层（外套）、内层（上衣）和底层（下装）</li>
              <li>每个类别可以选择"任选"或"不选择该类别"</li>
              <li>内层和底层必须至少有一个选择才能生成搭配</li>
              <li>点击"生成搭配"按钮可根据选择生成所有可行的搭配方案</li>
            </ul>
          </div>
          
          {/* 衣物类别管理 */}
          <div className="space-y-4">
            {categoryOrder.filter(category => wardrobe[category]).map(category => (
              <div key={category} className="bg-white p-3 rounded-lg shadow-sm">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">
                    {getCategoryName(category)} ({wardrobe[category].length})
                    <span className="ml-2 text-xs text-gray-500">
                      {getCategoryLayer(category) === 'outer' && '- 外层'}
                      {getCategoryLayer(category) === 'inner' && '- 内层'}
                      {getCategoryLayer(category) === 'bottom' && '- 底层'}
                      {getCategoryLayer(category) === 'special' && '- 特殊'}
                    </span>
                  </h3>
                  <button 
                    onClick={() => setEditCategory(category)}
                    className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                  >
                    编辑
                  </button>
                </div>
                
                <div className="mt-2 flex flex-wrap gap-2">
                  {wardrobe[category].slice(0, 5).map(item => (
                    <span key={item} className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {item}
                    </span>
                  ))}
                  {wardrobe[category].length > 5 && (
                    <span className="text-sm text-blue-500">+{wardrobe[category].length - 5}个</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          

        </div>
      )}
      
      {renderEditCategory()}
      {renderConfirmRemove()}
      {renderAddCategory()}
    </div>
  );
};

// 渲染应用
ReactDOM.render(<WardrobeApp />, document.getElementById('root'));
