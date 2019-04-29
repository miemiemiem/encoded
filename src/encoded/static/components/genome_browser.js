import React from 'react';
import PropTypes from 'prop-types';

const domainName = 'https://www.encodeproject.org';

// Outstanding questions:
// Which version of Gencode do we want to use?
// How do we want to toggle between hg19 and GRCh38? (and others)
// Need better display for Gencode, Repeats, and Genome
// No support for Genome (.2bit file)

// Files to be displayed on all genome browser results
const assembly = 'hg19';
let pinnedFiles = [];
if (assembly === 'GRCh38') {
    pinnedFiles = [
        {
            name: 'Genome',
            desc: 'Human reference genome build GRCh38/hg38 (GRCh38_no_alt_analysis_set_GCA_000001405.15)',
            twoBitURI: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/GRCh38/GRCh38_no_alt_analysis_set_GCA_000001405.15.2bit',
            tier_type: 'sequence',
            provides_entrypoints: true,
            pinned: true,
        },
        {
            name: 'GENCODE',
            desc: 'Gene structures from GENCODE v24',
            bwgURI: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/GRCh38/gencode.v24.annotation.bb',
            stylesheet_uri: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/GRCh38/gencode2_v24.xml',
            collapseSuperGroups: true,
            trixURI: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/GRCh38/gencode.v24.annotation.ix',
        },
        {
            name: 'Repeats',
            desc: 'Repeat annotation from RepeatMasker',
            bwgURI: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/GRCh38/repeats_GRCh38.bb',
            stylesheet_uri: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/GRCh38/bb-repeats2_GRCh38.xml',
            forceReduction: -1,
        },
    ];
} else if (assembly === 'hg19') {
    pinnedFiles = [
        // {
        //     name: 'Genome',
        //     desc: 'Human reference genome build GRCh37/hg19',
        //     href: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/hg19/male.hg19.2bit',
        //     tier_type: 'sequence',
        //     provides_entrypoints: true,
        //     pinned: true,
        // },
        {
            name: 'GENCODE',
            desc: 'Gene structures from GENCODE v19',
            href: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/hg19/gencode.v19.annotation.bb',
            stylesheet_uri: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/hg19/gencode_v19.xml',
            collapseSuperGroups: true,
            trixURI: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/hg19/gencode.v19.annotation.ix',
        },
        {
            name: 'Repeats',
            desc: 'Repeat annotation from RepeatMasker',
            href: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/hg19/repeats_hg19.bb',
            stylesheet_uri: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/hg19/bb-repeats_hg19.xml',
            forceReduction: -1,
        },
    ];
} else if (assembly === 'mm10' || assembly === 'mm10-minimal') {
    pinnedFiles = [
        {
            name: 'Genome',
            href: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/mm10/mm10_no_alt_analysis_set_ENCODE.2bit',
            desc: 'Mouse reference genome build GRCm38',
            tier_type: 'sequence',
            provides_entrypoints: true,
            pinned: true,
        },
        {
            name: 'Genes',
            desc: 'Gene structures from GENCODE M4',
            href: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/mm10/gencode.vM4.annotation.bb',
            stylesheet_uri: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/mm10/gencode_vM4.xml',
            collapseSuperGroups: true,
            trixURI: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/mm10/gencode.vM4.annotation.ix',
        },
        {
            name: 'Repeats',
            desc: 'Repeat annotation from UCSC',
            href: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/mm10/repeats_mm10.bb',
            stylesheet_uri: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/mm10/bb-repeats2_mm10.xml',
            forceReduction: -1,
        },
    ];
} else if (assembly === 'mm9') {
    pinnedFiles = [
        {
            name: 'Genome',
            href: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/mm9/mm9.2bit',
            desc: 'Mouse reference genome build NCBIm37',
            tier_type: 'sequence',
            provides_entrypoints: true,
            pinned: true,
        },
        {
            name: 'Genes',
            desc: 'Gene structures from GENCODE M1',
            href: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/mm9/gencode.vM1.annotation.bb',
            stylesheet_uri: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/mm9/gencode_vM1.xml',
            collapseSuperGroups: true,
            trixURI: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/mm9/gencode.vM1.annotation.ix',
        },
        {
            name: 'Repeats',
            desc: 'Repeat annotation from UCSC',
            href: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/mm9/repeats_mm9.bb',
            stylesheet_uri: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/mm9/bb-repeats_mm9.xml',
            forceReduction: -1,
        },
    ];
} else if (assembly === 'dm6') {
    pinnedFiles = [
        {
            name: 'Genome',
            href: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/dm6/dm6.2bit',
            desc: 'D. melanogaster reference genome build BDGP R6/dm6',
            tier_type: 'sequence',
            provides_entrypoints: true,
            pinned: true,
        },
        {
            name: 'Genes',
            desc: 'Gene structures from UCSC BDGP6 + ISO1 MT/dm6',
            href: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/dm6/dm6_UCSC_RefSeq_track.bb',
            // stylesheet_uri: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/dm6/',
            collapseSuperGroups: true,
            trixURI: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/dm6/dm6_UCSC_RefSeq_track.ix',
        },
        {
            name: 'Repeats',
            desc: 'Repeat annotation from UCSC',
            href: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/dm6/repeats_dm6.bb',
            // stylesheet_uri: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/dm6/',
            forceReduction: -1,
        },
    ];
} else if (assembly === 'dm3') {
    pinnedFiles = [
        {
            name: 'Genome',
            href: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/dm3/dm3.2bit',
            desc: 'D. melanogaster reference genome build BDGP R5/dm3',
            tier_type: 'sequence',
            provides_entrypoints: true,
            pinned: true,
        },
        {
            name: 'Genes',
            desc: 'Gene structures from UCSC BDGP R5/dm3',
            href: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/dm3/dm3_UCSC_RefSeq_track.bb',
            // stylesheet_uri: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/dm6/',
            collapseSuperGroups: true,
            trixURI: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/dm3/dm3_UCSC_RefSeq_track.ix',
        },
        {
            name: 'Repeats',
            desc: 'Repeat annotation from UCSC',
            href: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/dm3/repeats_dm3.bb',
            // stylesheet_uri: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/dm3/',
            forceReduction: -1,
        },
    ];
} else if (assembly === 'ce11') {
    pinnedFiles = [
        {
            name: 'Genome',
            href: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/ce11/ce11.2bit',
            desc: 'C. elegans reference genome build ce11/WBcel235',
            tier_type: 'sequence',
            provides_entrypoints: true,
            pinned: true,
        },
        {
            name: 'Genes',
            desc: 'Gene structures from UCSC ce11/WBCel235',
            href: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/ce11/ce11_UCSC_RefSeq_track.bb',
            // stylesheet_uri: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/ce11/',
            collapseSuperGroups: true,
            trixURI: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/ce11/ce11_UCSC_RefSeq_track.ix',
        },
        {
            name: 'Repeats',
            desc: 'Repeat annotation from UCSC',
            href: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/ce11/repeats_ce11.bb',
            // stylesheet_uri: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/ce11/',
            forceReduction: -1,
        },
    ];
} else if (assembly === 'ce10') {
    pinnedFiles = [
        {
            name: 'Genome',
            href: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/ce10/ce10.2bit',
            desc: 'C. elegans reference genome build ce10/WS220',
            tier_type: 'sequence',
            provides_entrypoints: true,
            pinned: true,
        },
        {
            name: 'Genes',
            desc: 'Gene structures from UCSC ce10/WS220',
            href: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/ce10/ce10_UCSC_RefSeq_track.bb',
            // stylesheet_uri: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/ce10/',
            collapseSuperGroups: true,
            trixURI: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/ce10/ce10_UCSC_RefSeq_track.ix',
        },
        {
            name: 'Repeats',
            desc: 'Repeat annotation from UCSC',
            href: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/ce10/repeats_ce10.bb',
            // stylesheet_uri: 'https://s3-us-west-1.amazonaws.com/encoded-build/browser/ce10/',
            forceReduction: -1,
        },
    ];
}

// Files to be displayed for local version of browser
const dummyFiles = [
    {
        file_format: 'bigWig',
        output_type: 'minus strand signal of all reads',
        accession: 'ENCFF425LKJ',
        href: '/files/ENCFF425LKJ/@@download/ENCFF425LKJ.bigWig',
    },
    {
        file_format: 'bigWig',
        output_type: 'plus strand signal of all reads',
        accession: 'ENCFF638QHN',
        href: '/files/ENCFF638QHN/@@download/ENCFF638QHN.bigWig',
    },
    {
        file_format: 'bigWig',
        output_type: 'plus strand signal of unique reads',
        accession: 'ENCFF541XFO',
        href: '/files/ENCFF541XFO/@@download/ENCFF541XFO.bigWig',
    },
    {
        file_format: 'bigBed',
        output_type: 'transcription start sites',
        accession: 'ENCFF517WSY',
        href: '/files/ENCFF517WSY/@@download/ENCFF517WSY.bigBed',
    },
    {
        file_format: 'bigBed',
        output_type: 'peaks',
        accession: 'ENCFF026DAN',
        href: '/files/ENCFF026DAN/@@download/ENCFF026DAN.bigBed',
    },
    {
        file_format: 'bigBed',
        output_type: 'peaks',
        accession: 'ENCFF847CBY',
        href: '/files/ENCFF847CBY/@@download/ENCFF847CBY.bigBed',
    },
];

class GenomeBrowser extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            width: 592,
            trackList: [],
            visualizer: null,
        };

        this.drawTracks = this.drawTracks.bind(this);
        this.drawTracksResized = this.drawTracksResized.bind(this);
    }

    componentDidMount() {
        // Extract only bigWig and bigBed files from the list:
        let files = this.props.files.filter(file => file.file_format === 'bigWig' || file.file_format === 'bigBed');
        files = files.filter(file => ['released', 'in progress', 'archived'].indexOf(file.status) > -1);
        files = [...pinnedFiles, ...files];

        let domain = `${window.location.protocol}//${window.location.hostname}`;
        if (domain.includes('localhost')) {
            console.log('we are LOOOOCAL');
            domain = domainName;
            files = [...pinnedFiles, ...dummyFiles];
        }

        console.log('these are the files');
        console.log(files);

        const tracks = files.map((file) => {
            if (file.name) {
                const trackObj = {};
                trackObj.name = file.name;
                trackObj.type = 'signal';
                trackObj.path = file.href;
                trackObj.heightPx = 50;
                return trackObj;
            } else if (file.file_format === 'bigWig') {
                const trackObj = {};
                trackObj.name = file.accession;
                trackObj.type = 'signal';
                trackObj.path = domain + file.href;
                trackObj.heightPx = 200;
                return trackObj;
            }
            const trackObj = {};
            trackObj.name = file.accession;
            trackObj.type = 'annotation';
            trackObj.compact = true;
            trackObj.path = domain + file.href;
            trackObj.heightPx = 50;
            return trackObj;
        });

        this.setState({ trackList: tracks }, () => {
            if (this.chartdisplay) {
                this.setState({
                    width: this.chartdisplay.clientWidth,
                }, () => {
                    this.drawTracks(this.chartdisplay);
                });
            }
        });
    }

    componentDidUpdate(prevProps) {
        console.log('genome browser component did update');
        console.log('this.props');
        console.log(this.props);
        console.log('prevProps');
        console.log(prevProps);
        // If the parent container changed size, we need to update the browser width
        if (this.props.expanded !== prevProps.expanded) {
            setTimeout(this.drawTracksResized, 1000);
        }
        if (this.props !== prevProps && this.props.files) {
            console.log("props have changed and we must recompute things");
            const newFiles = [...pinnedFiles, ...this.props.files];
            const tracks = newFiles.map((file) => {
                if (file.name) {
                    const trackObj = {};
                    trackObj.name = file.name;
                    trackObj.type = 'signal';
                    trackObj.path = file.href;
                    trackObj.heightPx = 50;
                    return trackObj;
                } else if (file.file_format === 'bigWig') {
                    const trackObj = {};
                    trackObj.name = file.accession;
                    trackObj.type = 'signal';
                    trackObj.path = this.state.domain + file.href;
                    trackObj.heightPx = 200;
                    return trackObj;
                }
                const trackObj = {};
                trackObj.name = file.accession;
                trackObj.type = 'annotation';
                trackObj.compact = true;
                trackObj.path = this.state.domain + file.href;
                trackObj.heightPx = 50;
                return trackObj;
            });

            console.log('these are the tracks');
            console.log(tracks);

            this.setState({ trackList: tracks }, () => {
                console.log(this.chartdisplay);
                if (this.chartdisplay) {
                    console.log("setting client width");
                    this.setState({
                        width: this.chartdisplay.clientWidth,
                    }, () => {
                        console.log("triggering draw tracks");
                        this.drawTracks(this.chartdisplay);
                    });
                }
            });
        }
    }

    drawTracksResized() {
        if (this.chartdisplay) {
            this.setState({ width: this.chartdisplay.clientWidth });
            this.state.visualizer.render({
                width: this.chartdisplay.clientWidth,
                height: this.state.visualizer.getContentHeight(),
            }, this.chartdisplay);
        }
    }

    drawTracks(container) {
        console.log("drawing tracks");
        const visualizer = new GenomeVisualizer({
            clampToTracks: true,
            panels: [{
                location: { contig: 'chr1', x0: 0, x1: 59e6 },
            }],
            tracks: this.state.trackList,
        });
        this.setState({ visualizer });
        visualizer.render({
            width: this.state.width,
            height: visualizer.getContentHeight(),
        }, container);
        visualizer.addEventListener('track-resize', this.drawTracksResized);
        window.addEventListener('resize', this.drawTracksResized);
    }

    render() {
        return (
            <div>
                <div ref={(div) => { this.chartdisplay = div; }} className="valis-browser" />
            </div>
        );
    }
}

GenomeBrowser.propTypes = {
    files: PropTypes.array.isRequired,
    expanded: PropTypes.bool.isRequired,
};

export default GenomeBrowser;
