import React from 'react';
import PropTypes from 'prop-types';
import { auditDecor } from './audit';
import * as globals from './globals';
import { Breadcrumbs } from './navigation';
import { DbxrefList } from './dbxref';
import { PickerActions } from './search';
import Status from './status';
import { DisplayAsJson } from './objectutils';
import { SortTablePanel, SortTable } from './sorttable';
import { FetchedData, Param } from './fetched';


const datasetsColumns = {
    accession: {
        display: dataset => <a href={dataset['@id']}>{dataset.accession}</a>,
        title: 'Accession',
    },
    type: {
        getValue: datasets => (datasets['@type'] || [''])[0], // only the first matters
        title: 'Type',
    },
    target: {
        getValue: dataset => (dataset.target ? dataset.target.label : ''),
        title: 'Target',
    },
    assay_term_name: {
        getValue: (dataset) => {
            // assay_term_name can be a string or an array
            if (typeof (dataset.assay_term_name) === 'string') {
                return dataset.assay_term_name;
            }
            return (dataset.assay_term_name || []).join(', ');
        },
        title: 'Assay',
    },
    description: {
        title: 'Description',
    },
    lab: {
        getValue: dataset => (dataset.lab ? dataset.lab.title : ''),
        title: 'Lab',
    },
    biosample_summary: {
        title: 'Biosample Summary',
    },
    status: {
        display: datasets => <Status item={datasets.status} badgeSize="small" css="result-table__status" />,
        title: 'Status',
    },
};

const fields = ['accession', 'target', '@type', 'target', 'biosample_summary', 'lab', 'assay_term_name', 'assay', 'description', 'status'].reduce((field1, field2) => `${field1}&field=${field2}`, '');

// Display a publication object.
const PublicationComponent = (props, reactContext) => {
    const context = props.context;
    const itemClass = globals.itemClass(context, 'view-item');

    // Set up breadcrumbs
    const categoryTerms = context.categories && context.categories.map(category => `categories=${category}`);
    const crumbs = [
        { id: 'Publications' },
        {
            id: context.categories ? context.categories.join(' + ') : null,
            query: (categoryTerms && categoryTerms.join('&')),
            tip: context.categories && context.categories.join(' + '),
        },
    ];

    const crumbsReleased = (context.status === 'released');
    const accessions = context.datasets ? context.datasets.reduce((dataset1, dataset2) => `${dataset1}&accession=${dataset2.accession}`, '') : '';
    const datasetsUrl = context.datasets && context.datasets.length > 0 ?
        `/search/?${accessions}${fields}&limit=all` :
        null;
    return (
        <div className={itemClass}>
            <Breadcrumbs root="/search/?type=Publication" crumbs={crumbs} crumbsReleased={crumbsReleased} />
            <h2>{context.title}</h2>
            {props.auditIndicators(context.audit, 'publication-audit', { session: reactContext.session })}
            {props.auditDetail(context.audit, 'publication-audit', { session: reactContext.session, except: context['@id'] })}
            {context.authors ? <div className="authors">{context.authors}.</div> : null}
            <DisplayAsJson />
            <div className="journal">
                <Citation {...props} />
            </div>

            {context.abstract || context.data_used || (context.identifiers && context.identifiers.length > 0) ?
                <div className="view-detail panel">
                    <Abstract {...props} />
                </div>
            : null}

            {context.datasets && context.datasets.length ?
                    <SortTablePanel title="Datasets">
                        <FetchedData>
                            <Param name="datasets" url={datasetsUrl} allowMultipleRequest />
                            <DatasetsComponent columns={datasetsColumns} />
                        </FetchedData>
                    </SortTablePanel>
            : null }

            {context.supplementary_data && context.supplementary_data.length ?
                <div>
                    <h3>Related data</h3>
                    <div className="panel view-detail" data-test="supplementarydata">
                        {context.supplementary_data.map((data, i) => <SupplementaryData data={data} key={i} />)}
                    </div>
                </div>
            : null}
        </div>
    );
};

PublicationComponent.propTypes = {
    context: PropTypes.object.isRequired,
    auditIndicators: PropTypes.func.isRequired, // Audit decorator function
    auditDetail: PropTypes.func.isRequired,
};

PublicationComponent.contextTypes = {
    session: PropTypes.object, // Login information from <App>
};

// Note that Publication needs to be exported for Jest tests.
const Publication = auditDecor(PublicationComponent);
export default Publication;

globals.contentViews.register(Publication, 'Publication');


const Citation = (props) => {
    const context = props.context;
    return (
        <span>
            {context.journal ? <i>{context.journal}. </i> : ''}{context.date_published ? `${context.date_published};` : <span>&nbsp;</span>}
            {context.volume ? context.volume : ''}{context.issue ? `(${context.issue})` : '' }{context.page ? `:${context.page}.` : <span>&nbsp;</span>}
        </span>
    );
};

Citation.propTypes = {
    context: PropTypes.object.isRequired, // Citation object being displayed
};


const Abstract = (props) => {
    const context = props.context;
    return (
        <dl className="key-value">
            {context.abstract ?
                <div data-test="abstract">
                    <dt>Abstract</dt>
                    <dd>{context.abstract}</dd>
                </div>
            : null}

            {context.data_used ?
                <div data-test="dataused">
                    <dt>Consortium data used in this publication</dt>
                    <dd>{context.data_used}</dd>
                </div>
            : null}

            {context.identifiers && context.identifiers.length ?
                <div data-test="references">
                    <dt>References</dt>
                    <dd><DbxrefList context={context} dbxrefs={context.identifiers} addClasses="multi-value" /></dd>
                </div>
            : null}
        </dl>
    );
};

Abstract.propTypes = {
    context: PropTypes.object.isRequired, // Abstract being displayed
};

const DatasetsComponent = (props) => {
    const { datasets, columns } = props;

    return (
        <SortTable list={datasets['@graph']} columns={columns} />
    );
};

DatasetsComponent.propTypes = {
    datasets: PropTypes.object,
    columns: PropTypes.object,
};

DatasetsComponent.defaultProps = {
    datasets: {},
    columns: {},
};

const SupplementaryData = (props) => {
    const data = props.data;
    return (
        <section className="supplementary-data">
            <dl className="key-value">
                {data.supplementary_data_type ?
                    <div data-test="availabledata">
                        <dt>Available data</dt>
                        <dd>{data.supplementary_data_type}</dd>
                    </div>
                : null}

                {data.file_format ?
                    <div data-test="fileformat">
                        <dt>File format</dt>
                        <dd>{data.file_format}</dd>
                    </div>
                : null}

                {data.url ?
                    <div data-test="url">
                        <dt>URL</dt>
                        <dd><a href={data.url}>{data.url}</a></dd>
                    </div>
                : null}

                {data.data_summary ?
                    <div data-test="datasummary">
                        <dt>Data summary</dt>
                        <dd>{data.data_summary}</dd>
                    </div>
                : null}
            </dl>
        </section>
    );
};

SupplementaryData.propTypes = {
    data: PropTypes.object.isRequired,
};


class SupplementaryDataListing extends React.Component {
    constructor() {
        super();

        // Set initial React state.
        this.state = { excerptExpanded: false };

        // Bind this to non-React methods.
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        this.setState(prevState => ({
            excerptExpanded: !prevState.excerptExpanded,
        }));
    }

    render() {
        const { data, id, index } = this.props;
        const summary = data.data_summary;
        const excerpt = (summary && (summary.length > 100) ? globals.truncateString(summary, 100) : undefined);

        // Make unique ID for ARIA identification
        const nodeId = id.replace(/\//g, '') + index;

        return (
            <div className="list-supplementary">
                {data.supplementary_data_type ?
                    <div><strong>Available supplemental data: </strong>{data.supplementary_data_type}</div>
                : null}

                {data.file_format ?
                    <div><strong>File format: </strong>{data.file_format}</div>
                : null}

                {data.url ?
                    <div><strong>URL: </strong><a href={data.url}>{data.url}</a></div>
                : null}

                {summary ?
                    <span id={nodeId} aria-expanded={excerpt ? this.state.excerptExpanded : true}>
                        <strong>Data summary: </strong>{excerpt ?
                            <span>
                                {this.state.excerptExpanded ? summary : excerpt}
                                <button className="btn btn-link" aria-controls={nodeId} onClick={this.handleClick}>
                                    {this.state.excerptExpanded ? <span>See less</span> : <span>See more</span>}
                                </button>
                            </span>
                        : summary}
                    </span>
                : null}
            </div>
        );
    }
}

SupplementaryDataListing.propTypes = {
    data: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    index: PropTypes.number,
};

SupplementaryDataListing.defaultProps = {
    index: 0,
};


const ListingComponent = (props, context) => {
    const result = props.context;
    const authorList = result.authors && result.authors.length ? result.authors.split(', ', 4) : [];
    const authors = authorList.length === 4 ? `${authorList.splice(0, 3).join(', ')}, et al` : result.authors;

    return (
        <li>
            <div className="clearfix">
                <PickerActions {...props} />
                <div className="pull-right search-meta">
                    <p className="type meta-title">Publication</p>
                    <Status item={result.status} badgeSize="small" css="result-table__status" />
                    {props.auditIndicators(result.audit, result['@id'], { session: context.session, search: true })}
                </div>
                <div className="accession"><a href={result['@id']}>{result.title}</a></div>
                <div className="data-row">
                    {authors ? <p className="list-author">{authors}.</p> : null}
                    <p className="list-citation"><Citation {...props} /></p>
                    {result.identifiers && result.identifiers.length ? <DbxrefList context={result} dbxrefs={result.identifiers} addClasses="list-reference" /> : '' }
                    {result.supplementary_data && result.supplementary_data.length ?
                        <div>
                            {result.supplementary_data.map((data, i) =>
                                <SupplementaryDataListing data={data} id={result['@id']} index={i} key={i} />
                            )}
                        </div>
                    : null}
                </div>
            </div>
            {props.auditDetail(result.audit, result['@id'], { session: context.session, forcedEditLink: true })}
        </li>
    );
};

ListingComponent.propTypes = {
    context: PropTypes.object.isRequired,
    auditIndicators: PropTypes.func.isRequired, // Audit decorator function
    auditDetail: PropTypes.func.isRequired, // Audit decorator function
};

ListingComponent.contextTypes = {
    session: PropTypes.object, // Login information from <App>
};

const Listing = auditDecor(ListingComponent);

globals.listingViews.register(Listing, 'Publication');
