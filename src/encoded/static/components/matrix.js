import React from 'react';
import PropTypes from 'prop-types';
import pluralize from 'pluralize';
import _ from 'underscore';
import url from 'url';
import { Panel, PanelBody } from '../libs/bootstrap/panel';
import { svgIcon } from '../libs/svg-icons';
import { tintColor, isLight } from './datacolors';
import DataTable from './datatable';
import * as globals from './globals';
import { MatrixInternalTags, ClearFilters } from './objectutils';
import { FacetList, TextFilter, SearchControls } from './search';


// Number of subcategory items to show when subcategory isn't disclosed.
const SUB_CATEGORY_SHORT_SIZE = 5;


/**
 * Render a category row of the matrix without its subcategory rows.
 */
class RowCategoryExpander extends React.Component {
    constructor() {
        super();
        this.handleClick = this.handleClick.bind(this);
    }

    /**
     * Called when the user clicks the expansion button to expand or collapse the section.
     */
    handleClick() {
        this.props.expandClickHandler(this.props.categoryName);
    }

    render() {
        const { categoryId, expanderColor, expanderBgColor, expanded } = this.props;
        return (
            <button
                className="matrix__category-expander"
                aria-expanded={expanded}
                aria-controls={categoryId}
                onClick={this.handleClick}
                style={{ backgroundColor: expanderBgColor }}
            >
                {svgIcon(expanded ? 'chevronUp' : 'chevronDown', { fill: expanderColor })}
            </button>
        );
    }
}

RowCategoryExpander.propTypes = {
    categoryId: PropTypes.string.isRequired,
    categoryName: PropTypes.string.isRequired,
    expanderColor: PropTypes.string,
    expanderBgColor: PropTypes.string,
    expanded: PropTypes.bool,
    expandClickHandler: PropTypes.func.isRequired,
};

RowCategoryExpander.defaultProps = {
    expanderColor: '#000',
    expanderBgColor: 'transparent',
    expanded: false,
};


class SearchFilter extends React.Component {
    constructor() {
        super();
        this.onChange = this.onChange.bind(this);
    }

    onChange(href) {
        this.context.navigate(href);
    }

    render() {
        const { context } = this.props;
        const parsedUrl = url.parse(this.context.location_href);
        const matrixBase = parsedUrl.search || '';
        const matrixSearch = matrixBase + (matrixBase ? '&' : '?');
        const parsed = url.parse(matrixBase, true);
        const queryStringType = parsed.query.type || '';
        const type = pluralize(queryStringType.toLocaleLowerCase());
        return (
            <div className="matrix-general-search">
                <p>Enter search terms to filter the {type} included in the matrix.</p>
                <div className="general-search-entry">
                    <i className="icon icon-search" />
                    <div className="searchform">
                        <TextFilter filters={context.filters} searchBase={matrixSearch} onChange={this.onChange} />
                    </div>
                </div>
            </div>
        );
    }
}

SearchFilter.propTypes = {
    /** Matrix search results object */
    context: PropTypes.object.isRequired,
};

SearchFilter.contextTypes = {
    navigate: PropTypes.func,
    location_href: PropTypes.string,
};


const analyzeSubCategoryData = (subCategoryData, columnCategory) => {
    const subCategorySums = [];
    let maxSubCategoryValue;
    let minSubCategoryValue;

    subCategoryData.forEach((rowData) => {
        // `rowData` has all the data for one row
        rowData[columnCategory].forEach((value, colIndex) => {
            subCategorySums[colIndex] = (subCategorySums[colIndex] || 0) + value;
        });

        // Update min and max values.
        const prospectiveMax = Math.max(...rowData[columnCategory]);
        if (maxSubCategoryValue === undefined || maxSubCategoryValue < prospectiveMax) {
            maxSubCategoryValue = prospectiveMax;
        }
        const prospectiveMin = Math.min(...rowData[columnCategory]);
        if (minSubCategoryValue === undefined || minSubCategoryValue > prospectiveMin) {
            minSubCategoryValue = prospectiveMin;
        }
    });
    return { subCategorySums, maxSubCategoryValue, minSubCategoryValue };
};


const convertExperimentToDataTable = (context, getRowCategories, expandedRowCategories, expandedClickHandler) => {
    const rowCategory = context.matrix.y.group_by[0];
    const rowSubCategory = context.matrix.y.group_by[1];
    const columnCategory = context.matrix.x.group_by;

    // Generate the top-row sideways header labels. First item is null for the empty upper-left
    // cell.
    const colCategoryNames = context.matrix.x.buckets.map(colCategoryBucket => colCategoryBucket.key);
    const header = [{ header: null }].concat(colCategoryNames.map(colCategoryName => ({
        header: <a href={`${context.matrix.search_base}&${columnCategory}=${colCategoryName}`}>{colCategoryName}</a>,
    })));

    // Generate the main table content including the data hierarchy, where the upper-level of the
    // hierarchy gets referred to here as "rowCategory" and the lower-level gets referred to as
    // "subCategory." Both these types of rows get collected into `matrixDataTable`.
    const { rowCategoryData, rowCategoryColors, rowCategoryNames } = getRowCategories();
    const matrixRowKeys = ['column-categories'];
    let matrixRow = 1;
    const matrixDataTable = rowCategoryData.reduce((accumulatingTable, categoryBucket, rowCategoryIndex) => {
        const subCategoryData = categoryBucket[rowSubCategory].buckets;
        const rowCategoryColor = rowCategoryColors[rowCategoryIndex];
        const rowCategoryTextColor = isLight(rowCategoryColor) ? '#000' : '#fff';
        const expandableRowCategory = subCategoryData.length > SUB_CATEGORY_SHORT_SIZE;

        // For the current category, collect the sum of every column into an array.
        // categoryBucket is object with categoryBucket[rowSubCategory].buckets being array
        // representing each row within the category (e.g. 'cell line'). Each entry is object with
        // categoryBucket[rowSubCategory].buckets[i][columnCategory] being array of counts, one
        // per column.
        const { subCategorySums, minSubCategoryValue, maxSubCategoryValue } = analyzeSubCategoryData(categoryBucket[rowSubCategory].buckets, columnCategory);
        const logBase = Math.log(1 + maxSubCategoryValue + minSubCategoryValue);

        // Generate one category's rows of subcategories, adding a header cell for each subcategory
        // on the left of the row.
        const categoryNameQuery = globals.encodedURIComponent(categoryBucket.key);
        const categoryExpanded = expandedRowCategories.indexOf(categoryBucket.key) !== -1;
        const renderedData = categoryExpanded ? subCategoryData : subCategoryData.slice(0, SUB_CATEGORY_SHORT_SIZE);
        matrixRowKeys[matrixRow] = categoryNameQuery;
        matrixRow += 1;
        const subCategoryRows = renderedData.map((subCategoryBucket) => {
            // Generate an array of data cells for a single row's data.
            const cells = subCategoryBucket[columnCategory].map((cellData, columnIndex) => {
                // Generate one data cell with a color tint that varies based on its value within
                // the range of data in this category.
                let tintFactor = 0;
                if (cellData > 0) {
                    // Generate a tint from 0 (no change) to 1 (white) with a log curve over the
                    // range of data.
                    tintFactor = maxSubCategoryValue > minSubCategoryValue ? 1 - (Math.log(1 + (cellData - minSubCategoryValue)) / logBase) : 0.5;
                }
                const cellColor = tintColor(rowCategoryColor, tintFactor);
                const textColor = isLight(cellColor) ? '#000' : '#fff';
                return {
                    content: (
                        cellData > 0 ?
                            <a href={`${context.matrix.search_base}&${rowSubCategory}=${globals.encodedURIComponent(subCategoryBucket.key)}&${columnCategory}=${globals.encodedURIComponent(colCategoryNames[columnIndex])}`} style={{ color: textColor }}>{cellData}</a>
                        :
                            <div />
                    ),
                    style: { backgroundColor: cellData > 0 ? cellColor : 'transparent' },
                };
            });

            // Add a single row's data and left header to the matrix.
            const subCategoryQuery = globals.encodedURIComponent(subCategoryBucket.key);
            matrixRowKeys[matrixRow] = `${categoryNameQuery}-${subCategoryQuery}`;
            matrixRow += 1;
            return {
                rowContent: [
                    { header: <a href={`${context.matrix.search_base}&${rowSubCategory}=${subCategoryQuery}`}>{subCategoryBucket.key}</a> },
                ].concat(cells),
                css: 'matrix__row-data',
            };
        });

        // Generate a row for a row category alone, concatenated with the subcategory rows under
        // it, concatenated with an empty spacer row.
        matrixRowKeys[matrixRow] = `${categoryNameQuery}-spacer`;
        matrixRow += 1;
        return accumulatingTable.concat(
            [
                {
                    rowContent: [{
                        header: (
                            <div style={{ backgroundColor: rowCategoryColor }}>
                                {expandableRowCategory ?
                                    <RowCategoryExpander
                                        categoryId={categoryNameQuery}
                                        categoryName={categoryBucket.key}
                                        expanderColor={rowCategoryTextColor}
                                        expanded={categoryExpanded}
                                        expandClickHandler={expandedClickHandler}
                                    />
                                : null}
                                <a href={`${context['@id']}&${rowCategory}=${categoryNameQuery}&y.limit=`} style={{ color: rowCategoryTextColor }} id={categoryNameQuery}>{rowCategoryNames[categoryBucket.key]}</a>
                            </div>
                        ),
                    }].concat(subCategorySums.map((subCategorySum, subCategorySumIndex) => ({
                        content: (
                            subCategorySum > 0 ?
                                <a style={{ backgroundColor: rowCategoryColor, color: rowCategoryTextColor }} href={`${context.matrix.search_base}&${rowCategory}=${categoryNameQuery}&${columnCategory}=${globals.encodedURIComponent(colCategoryNames[subCategorySumIndex])}`}>
                                    {subCategorySum}
                                </a>
                            :
                                <div style={{ backgroundColor: rowCategoryColor }} />
                        ),
                    }))),
                    css: 'matrix__row-category',
                },
            ],
            subCategoryRows,
            [{
                rowContent: [
                    {
                        content: (
                            expandableRowCategory ?
                                <RowCategoryExpander
                                    categoryId={categoryNameQuery}
                                    categoryName={categoryBucket.key}
                                    expanded={categoryExpanded}
                                    expandClickHandler={expandedClickHandler}
                                    expanderColor={rowCategoryTextColor}
                                    expanderBgColor={rowCategoryColor}
                                />
                            : <div />
                        ),
                        colSpan: 0,
                    },
                ],
                css: `matrix__row-spacer${expandableRowCategory ? ' matrix__row-spacer--expander' : ''}`,
            }]
        );
    }, [{ rowContent: header, css: 'matrix__col-category-header' }]);
    return { dataTable: matrixDataTable, rowKeys: matrixRowKeys };
};


// Render the title panel and the horizontal facets.
const MatrixHeader = (props) => {
    const { context } = props;

    return (
        <div className="matrix__header">
            <h1>{context.title}</h1>
            <MatrixInternalTags context={context} />
        </div>
    );
};

MatrixHeader.propTypes = {
    context: PropTypes.object.isRequired, // Summary search result object
};


/**
 * Render the vertical facets.
 */
class MatrixVerticalFacets extends React.Component {
    constructor() {
        super();

        // Bind `this` to non-React methods.
        this.onFilter = this.onFilter.bind(this);
    }

    onFilter(e) {
        const search = e.currentTarget.getAttribute('href');
        this.context.navigate(search);
        e.stopPropagation();
        e.preventDefault();
    }

    render() {
        const { context } = this.props;

        // Calculate the searchBase, which is the current search query string fragment that can have
        // terms added to it.
        const searchBase = `${url.parse(this.context.location_href).search}&` || '?';

        return (
            <div className="matrix__facets-vertical">
                <ClearFilters searchUri={context.matrix.clear_matrix} displayTest={context.filters.length > 0} />
                <SearchFilter context={context} />
                <FacetList
                    facets={context.facets}
                    filters={context.filters}
                    searchBase={searchBase}
                    onFilter={this.onFilter}
                    addClasses="matrix-facets"
                />
            </div>
        );
    }
}

MatrixVerticalFacets.propTypes = {
    context: PropTypes.object.isRequired, // Summary search result object
};

MatrixVerticalFacets.contextTypes = {
    /** Current URL */
    location_href: PropTypes.string,
    /** System navigation function */
    navigate: PropTypes.func,
};


// Maximum number of selected items that can be visualized.
const VISUALIZE_LIMIT = 500;


/**
 * Display the matrix and associated controls.
 */
class MatrixPresentation extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            disclosedRowCategories: [],
            leftShadingShowing: false,
            rightShadingShowing: false,
            scrollProportion: 0,
        };
        this.discloseClickHandler = this.discloseClickHandler.bind(this);
        this.handleOnScroll = this.handleOnScroll.bind(this);
        this.handleScrollShading = this.handleScrollShading.bind(this);
    }

    componentDidMount() {
        // Establish initial matrix scroll shading.
        this.handleScrollShading(this.scrollElement);
    }

    componentDidUpdate(prevProps) {
        // If URI changed, we need to update the scroll shading in case the width of the table
        // changed.
        if (prevProps.context['@id'] !== this.props.context['@id']) {
            this.handleScrollShading(this.scrollElement);
            this.setState({ disclosedRowCategories: [] });
        }
    }

    /**
     * Called when the user clicks on the disclosure button on a category to collapse or expand it.
     * @param {string} category Key for the category
     */
    discloseClickHandler(category) {
        this.setState((prevState) => {
            const matchingCategoryIndex = prevState.disclosedRowCategories.indexOf(category);
            if (matchingCategoryIndex === -1) {
                // Category doesn't exist in array, so add it.
                return { disclosedRowCategories: prevState.disclosedRowCategories.concat(category) };
            }

            // Category does exist in array, so remove it.
            const disclosedCategories = prevState.disclosedRowCategories;
            return { disclosedRowCategories: [...disclosedCategories.slice(0, matchingCategoryIndex), ...disclosedCategories.slice(matchingCategoryIndex + 1)] };
        });
    }

    /**
     * Called when the user scrolls the matrix horizontally within its div to handle the shading on
     * the left and right edges.
     * @param {object} e React synthetic event
     */
    handleOnScroll(e) {
        this.handleScrollShading(e.target);
    }

    /**
     * Apply shading along the left or right of the scrolling matrix DOM element based on its
     * current scrolled position.
     * @param {object} element DOM element to apply shading to
     */
    handleScrollShading(element) {
        if (element.scrollLeft === 0 && this.state.leftShadingShowing) {
            // Left edge of matrix scrolled into view.
            this.setState({ leftShadingShowing: false });
        } else if (element.scrollLeft + element.clientWidth === element.scrollWidth && this.state.rightShadingShowing) {
            // Right edge of matrix scrolled into view.
            this.setState({ rightShadingShowing: false });
        } else if (element.scrollLeft > 0 && !this.state.leftShadingShowing) {
            // Left edge of matrix scrolled out of view.
            this.setState({ leftShadingShowing: true });
        } else if (element.scrollLeft + element.clientWidth < element.scrollWidth && !this.state.rightShadingShowing) {
            // Right edge of matrix scrolled out of view.
            this.setState({ rightShadingShowing: true });
        }
    }

    render() {
        const { context, rowCategoryGetter } = this.props;
        const { scrollProportion } = this.state;
        const { leftShadingShowing, rightShadingShowing } = this.state;
        const visualizeDisabledTitle = context.matrix.doc_count > VISUALIZE_LIMIT ? `Filter to ${VISUALIZE_LIMIT} to visualize` : '';

        // Convert encode data to a DataTable object.
        const { dataTable, rowKeys } = convertExperimentToDataTable(context, rowCategoryGetter, this.state.disclosedRowCategories, this.discloseClickHandler);
        const matrixConfig = {
            rows: dataTable,
            rowKeys,
            tableCss: 'matrix',
        };

        return (
            <div className="matrix__presentation">
                <h4>Showing {context.matrix.doc_count} results</h4>
                <SearchControls context={context} visualizeDisabledTitle={visualizeDisabledTitle} onFilter={this.onFilter} />
                <div className={`matrix__label matrix__label--horz${rightShadingShowing ? ' horz-scroll' : ''}`}>
                    <span>{context.matrix.x.label}</span>
                    {svgIcon('largeArrow')}
                </div>
                <div className="matrix__presentation-content">
                    <div className="matrix__label matrix__label--vert"><div>{svgIcon('largeArrow')}{context.matrix.y.label}</div></div>
                    <div className="matrix__data-wrapper">
                        <div className="matrix__data" onScroll={this.handleOnScroll} ref={(element) => { this.scrollElement = element; }}>
                            <DataTable tableData={matrixConfig} />
                        </div>
                        <div className={`matrix-shading matrix-shading--left${leftShadingShowing ? ' showing' : ''}`} />
                        <div className={`matrix-shading matrix-shading--right${rightShadingShowing ? ' showing' : ''}`} />
                    </div>
                </div>
            </div>
        );
    }
}

MatrixPresentation.propTypes = {
    /** Matrix search result object */
    context: PropTypes.object.isRequired,
    /** Callback to retrieve row categories */
    rowCategoryGetter: PropTypes.func.isRequired,
};


/**
 * Render the vertical facets and the matrix itself.
 */
const MatrixContent = ({ context, rowCategoryGetter }) => (
    <div className="matrix__content">
        <MatrixVerticalFacets context={context} />
        <MatrixPresentation context={context} rowCategoryGetter={rowCategoryGetter} />
    </div>
);

MatrixContent.propTypes = {
    /** Matrix search result object */
    context: PropTypes.object.isRequired,
    /** Callback to retrieve row categories from matrix data */
    rowCategoryGetter: PropTypes.func,
};

MatrixContent.defaultProps = {
    rowCategoryGetter: null,
};


class Matrix extends React.Component {
    constructor() {
        super();

        // Bind this to non-React methods.
        this.onChange = this.onChange.bind(this);
        this.onFilter = this.onFilter.bind(this);
        this.getRowCategories = this.getRowCategories.bind(this);
    }

    onChange(href) {
        this.context.navigate(href);
    }

    onFilter(e) {
        const search = e.currentTarget.getAttribute('href');
        this.context.navigate(search);
        e.stopPropagation();
        e.preventDefault();
    }

    // Called to sort the audit row categories by the order in `auditOrderKey`.
    getRowCategories() {
        const rowCategory = this.props.context.matrix.y.group_by[0];
        const rowCategoryData = this.props.context.matrix.y[rowCategory].buckets;
        const rowCategoryColors = globals.biosampleTypeColors.colorList(rowCategoryData.map(rowDataValue => rowDataValue.key));
        const rowCategoryNames = {};
        rowCategoryData.forEach((datum) => {
            rowCategoryNames[datum.key] = datum.key;
        });
        return {
            rowCategoryData,
            rowCategoryColors,
            rowCategoryNames,
        };
    }

    render() {
        const { context } = this.props;
        const itemClass = globals.itemClass(context, 'view-item');

        if (context.matrix.doc_count) {
            return (
                <Panel addClasses={itemClass}>
                    <PanelBody>
                        <MatrixHeader context={context} />
                        <MatrixContent context={context} rowCategoryGetter={this.getRowCategories} />
                    </PanelBody>
                </Panel>
            );
        }
        return <h4>No results found</h4>;
    }
}

Matrix.propTypes = {
    context: React.PropTypes.object.isRequired,
};

Matrix.contextTypes = {
    location_href: PropTypes.string,
    navigate: PropTypes.func,
    biosampleTypeColors: PropTypes.object, // DataColor instance for experiment project
};

globals.contentViews.register(Matrix, 'Matrix');


// Defines the order that audits should appear in the matrix.
const auditOrderKey = [
    'no_audits',
    'audit.WARNING.category',
    'audit.NOT_COMPLIANT.category',
    'audit.ERROR.category',
    'audit.INTERNAL_ACTION.category',
];

// Audit matrix row category colors.
const auditColors = ['#009802', '#e0e000', '#ff8000', '#cc0700', '#a0a0a0'];

// Maps audit keys to human-readable names.
const auditNames = {
    no_audits: 'No audits',
    'audit.WARNING.category': 'Warning',
    'audit.NOT_COMPLIANT.category': 'Not Compliant',
    'audit.ERROR.category': 'Error',
    'audit.INTERNAL_ACTION.category': 'Internal Action',
};


class AuditMatrix extends React.Component {
    constructor() {
        super();

        // Bind this to non-React methods.
        this.onChange = this.onChange.bind(this);
        this.onFilter = this.onFilter.bind(this);
        this.getRowCategories = this.getRowCategories.bind(this);
    }

    onChange(href) {
        this.context.navigate(href);
    }

    onFilter(e) {
        const search = e.currentTarget.getAttribute('href');
        this.context.navigate(search);
        e.stopPropagation();
        e.preventDefault();
    }

    // Called to sort the audit row categories by the order in `auditOrderKey`.
    getRowCategories() {
        const rowCategory = this.props.context.matrix.y.group_by[0];
        const rowCategories = this.props.context.matrix.y[rowCategory].buckets;
        const rowCategoryData = _.sortBy(rowCategories, (categoryBucket =>
            auditOrderKey.indexOf(categoryBucket.key)
        ));
        return {
            rowCategoryData,
            rowCategoryColors: auditColors,
            rowCategoryNames: auditNames,
        };
    }

    render() {
        const { context } = this.props;
        const itemClass = globals.itemClass(context, 'view-item');

        if (context.matrix.doc_count) {
            return (
                <Panel addClasses={itemClass}>
                    <PanelBody>
                        <MatrixHeader context={context} />
                        <MatrixContent context={context} rowCategoryGetter={this.getRowCategories} />
                    </PanelBody>
                </Panel>
            );
        }
        return <h4>No results found</h4>;
    }
}

AuditMatrix.propTypes = {
    context: React.PropTypes.object.isRequired,
};

AuditMatrix.contextTypes = {
    location_href: PropTypes.string,
    navigate: PropTypes.func,
    biosampleTypeColors: PropTypes.object, // DataColor instance for experiment project
};

globals.contentViews.register(AuditMatrix, 'AuditMatrix');
